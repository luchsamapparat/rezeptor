import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appEnvironment } from '../../appEnvironment';
import { findChallengeEntitiesByGroupIdAndType } from '../infrastructure/persistence/challenge';
import { findGroupEntityByInvitationCode, updateGroupEntity } from '../infrastructure/persistence/group';

const requestBodySchema = z.object({
  invitationCode: z.string(),
  registrationResponse: z.object({}).passthrough().transform(value => value as unknown as RegistrationResponseJSON)
})

export async function registerAuthenticator(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const { rpId, allowedOrigin } = appEnvironment.get('authenticationConfig');

  const { invitationCode, registrationResponse } = requestBodySchema.parse(await request.json());

  const group = await findGroupEntityByInvitationCode(groupContainer, invitationCode);
  const challenges = await findChallengeEntitiesByGroupIdAndType(challengeContainer, group.id, 'registration');

  const { registrationInfo, verified } = await verifyRegistrationResponse({
    response: registrationResponse,
    expectedChallenge: givenChallenge => challenges.some(({ value }) => value === givenChallenge),
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

    await updateGroupEntity(groupContainer, group.id, {
      authenticators: [
        ...group.authenticators,
        {
          credentialId: credentialID,
          credentialPublicKey,
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
  handler: registerAuthenticator
});
