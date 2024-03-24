import { app } from '@azure/functions';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appEnvironment } from '../../appEnvironment';
import { RequestHandler, createRequestHandler } from '../../handler';
import { deleteChallengeEntity, findChallengeEntitiesByGroupIdAndType } from '../infrastructure/persistence/challenge';
import { findGroupEntityByInvitationCode, updateGroupEntity } from '../infrastructure/persistence/group';

const requestBodySchema = z.object({
  invitationCode: z.string(),
  registrationResponse: z.object({}).passthrough().transform(value => value as unknown as RegistrationResponseJSON)
})

const registerAuthenticator: RequestHandler = async request => {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const { rpId, allowedOrigin } = appEnvironment.get('authenticationConfig');

  const { invitationCode, registrationResponse } = requestBodySchema.parse(await request.json());

  const group = await findGroupEntityByInvitationCode(groupContainer, invitationCode);
  const challenges = await findChallengeEntitiesByGroupIdAndType(challengeContainer, group.id, 'registration');

  const { registrationInfo, verified } = await verifyRegistrationResponse({
    response: registrationResponse,
    expectedChallenge: givenChallenge => challenges.some(async challenge => {
      if (challenge.value !== givenChallenge) {
        return false;
      }
      await deleteChallengeEntity(challengeContainer, challenge.id);
      return true;
    }),
    expectedRPID: rpId,
    expectedOrigin: allowedOrigin
  });


  if (verified && registrationInfo !== undefined) {
    const {
      credentialPublicKey,
      credentialID,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;

    const serializedCredentialId = isoBase64URL.fromBuffer(credentialID);
    const serializedCredentialPublicKey = isoBase64URL.fromBuffer(credentialPublicKey);

    await updateGroupEntity(groupContainer, group.id, {
      authenticators: [
        ...group.authenticators,
        {
          credentialId: serializedCredentialId,
          credentialPublicKey: serializedCredentialPublicKey,
          counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: registrationResponse.response.transports,
        }
      ]
    })
  }

  return {
    jsonBody: { verified, groupId: group.id }
  };
};

app.http('registerAuthenticator', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(registerAuthenticator)
});
