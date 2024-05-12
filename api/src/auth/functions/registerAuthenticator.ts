import { app } from '@azure/functions';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type { RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appContext } from '../../appContext';
import type { RequestHandler } from '../../handler';
import { createRequestHandler } from '../../handler';

const requestBodySchema = z.object({
  invitationCode: z.string(),
  registrationResponse: z.object({}).passthrough()
    .transform(value => value as unknown as RegistrationResponseJSON)
});

const registerAuthenticator: RequestHandler = async ({ request, appContext: env }) => {
  const groupRepository = await env.get('groupRepository');
  const challengeRepository = await env.get('challengeRepository');
  const { rpId, allowedOrigin } = env.get('authenticationConfig');

  const { invitationCode, registrationResponse } = requestBodySchema.parse(await request.json());

  const group = await groupRepository.findByInvitationCode(invitationCode);

  if (group === null) {
    throw new Error(`cannot find group for invitation code (${invitationCode})`);
  }

  const challenges = await challengeRepository.findByGroupIdAndType(group.id, 'registration');

  const { registrationInfo, verified } = await verifyRegistrationResponse({
    response: registrationResponse,
    expectedChallenge: givenChallenge => challenges.some(async challenge => {
      if (challenge.value !== givenChallenge) {
        return false;
      }
      await challengeRepository.delete(challenge.id);
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

    const serializedCredentialPublicKey = isoBase64URL.fromBuffer(credentialPublicKey);

    await groupRepository.update(group.id, {
      authenticators: [
        ...group.authenticators,
        {
          credentialId: credentialID,
          credentialPublicKey: serializedCredentialPublicKey,
          counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: registrationResponse.response.transports,
        }
      ]
    });
  }

  return {
    jsonBody: { verified, groupId: group.id }
  };
};

app.http('registerAuthenticator', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(appContext, registerAuthenticator)
});
