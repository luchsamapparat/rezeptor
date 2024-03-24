import { app } from '@azure/functions';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { AuthenticationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appEnvironment } from '../../appEnvironment';
import { RequestHandler, createRequestHandler } from '../../handler';
import { createGroupCookie, createSessionCookie, createSessionKeyCookie } from '../cookie';
import { deleteChallengeEntity, findChallengeEntitiesByGroupIdAndType } from '../infrastructure/persistence/challenge';
import { getGroupEntity, updateGroupEntity } from '../infrastructure/persistence/group';
import { createSessionEntity } from '../infrastructure/persistence/session';
import { toAuthenticatorDevice } from '../model';

const requestBodySchema = z.object({
  groupId: z.string().uuid(),
  authenticationResponse: z.object({}).passthrough().transform(value => value as unknown as AuthenticationResponseJSON)
})

const verifyAuthentication: RequestHandler = async request => {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const sessionContainer = await appEnvironment.get('sessionContainer');
  const { rpId, allowedOrigin, sessionTtl, cookieDomain, sessionKeySecret } = appEnvironment.get('authenticationConfig');

  const { groupId, authenticationResponse } = requestBodySchema.parse(await request.json());

  const group = await getGroupEntity(groupContainer, groupId);

  if (group === null) {
    throw new Error(`unknown group ID ${groupId}`);
  }

  const authenticatedCredentialId = isoBase64URL.toBuffer(authenticationResponse.rawId);

  const usedAuthenticator = group.authenticators.find(({ credentialId }) => {
    return isoUint8Array.areEqual(authenticatedCredentialId, isoBase64URL.toBuffer(credentialId));
  });

  if (usedAuthenticator === undefined) {
    throw new Error(`unknown credential ID ${authenticationResponse.rawId}`);
  }

  const challenges = await findChallengeEntitiesByGroupIdAndType(challengeContainer, group.id, 'authentication');

  const { authenticationInfo, verified } = await verifyAuthenticationResponse({
    response: authenticationResponse,
    expectedChallenge: givenChallenge => challenges.some(async challenge => {
      if (challenge.value !== givenChallenge) {
        return false;
      }
      await deleteChallengeEntity(challengeContainer, challenge.id);
      return true;
    }),
    expectedOrigin: allowedOrigin,
    expectedRPID: rpId,
    authenticator: toAuthenticatorDevice(usedAuthenticator)
  });

  if (!verified) {
    return {
      status: 422
    };
  }

  const { id: sessionId } = await createSessionEntity(sessionContainer, { groupId });

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

  return {
    status: 204,
    cookies: [
      createSessionKeyCookie(sessionId, { cookieDomain, sessionTtl, sessionKeySecret }),
      createSessionCookie({ cookieDomain, sessionTtl }),
      createGroupCookie(groupId, { cookieDomain })
    ]
  };
};

app.http('verifyAuthentication', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(verifyAuthentication)
});
