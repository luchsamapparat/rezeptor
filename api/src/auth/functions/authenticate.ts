import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { AuthenticationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appEnvironment } from '../../appEnvironment';
import { findChallengeEntitiesByGroupIdAndType } from '../infrastructure/persistence/challenge';
import { getGroupEntity, updateGroupEntity } from '../infrastructure/persistence/group';
import { createSessionEntity } from '../infrastructure/persistence/session';
import { toAuthenticatorDevice } from '../model';

const requestBodySchema = z.object({
  groupId: z.string().uuid(),
  authenticationResponse: z.object({}).passthrough().transform(value => value as unknown as AuthenticationResponseJSON)
})

export async function authenticate(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const sessionContainer = await appEnvironment.get('sessionContainer');
  const { rpId, allowedOrigin } = appEnvironment.get('authenticationConfig');

  const { groupId, authenticationResponse } = requestBodySchema.parse(await request.json());

  const group = await getGroupEntity(groupContainer, groupId);

  if (group === undefined) {
    throw new Error(`unknown group ID ${groupId}`);
  }

  const authenticationCredentialId = isoBase64URL.toBuffer(authenticationResponse.rawId);

  const usedAuthenticator = group.authenticators.find(({ credentialId }) => isoUint8Array.areEqual(authenticationCredentialId, credentialId));

  if (usedAuthenticator === undefined) {
    throw new Error(`unknown credential ID ${authenticationCredentialId}`);
  }

  const challenges = await findChallengeEntitiesByGroupIdAndType(challengeContainer, group.id, 'authentication');

  const { authenticationInfo, verified } = await verifyAuthenticationResponse({
    response: authenticationResponse,
    expectedChallenge: givenChallenge => challenges.some(({ value }) => value === givenChallenge),
    expectedOrigin: allowedOrigin,
    expectedRPID: rpId,
    authenticator: toAuthenticatorDevice(usedAuthenticator)
  });


  let sessionId = undefined;

  if (verified) {
    sessionId = await createSessionEntity(sessionContainer, { groupId });

    const { newCounter } = authenticationInfo;

    await updateGroupEntity(groupContainer, group.id, {
      authenticators: [
        ...group.authenticators.filter(authenticator => authenticator !== usedAuthenticator),
        {
          ...usedAuthenticator,
          counter: newCounter
        }
      ]
    });
  }

  return {
    jsonBody: { verified, sessionId }
  };
};

app.http('authenticate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: authenticate
});
