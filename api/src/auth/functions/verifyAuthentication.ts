import { app } from '@azure/functions';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { AuthenticationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appEnvironment } from '../../appEnvironment';
import { RequestHandler, createRequestHandler } from '../../handler';
import { createGroupCookie, createSessionCookie, createSessionKeyCookie, getGroupIdFromCookie } from '../cookie';
import { toAuthenticatorDevice } from '../model';

const requestBodySchema = z.object({
  groupId: z.string().uuid().optional(),
  authenticationResponse: z.object({}).passthrough().transform(value => value as unknown as AuthenticationResponseJSON)
})

const verifyAuthentication: RequestHandler = async request => {
  const groupRepository = await appEnvironment.get('groupRepository');
  const challengeRepository = await appEnvironment.get('challengeRepository');
  const sessionRepository = await appEnvironment.get('sessionRepository');
  const { rpId, allowedOrigin, sessionTtl, cookieDomain, cookieSecret } = appEnvironment.get('authenticationConfig');

  const { groupId: groupIdFromRequestBody, authenticationResponse } = requestBodySchema.parse(await request.json());

  const groupId = groupIdFromRequestBody ?? getGroupIdFromCookie(request, { cookieSecret });

  if (groupId === null) {
    throw new Error(`group ID provided`);
  }

  const group = await groupRepository.get(groupId);

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

  const challenges = await challengeRepository.findByGroupIdAndType(group.id, 'authentication');

  const { authenticationInfo, verified } = await verifyAuthenticationResponse({
    response: authenticationResponse,
    expectedChallenge: givenChallenge => challenges.some(async challenge => {
      if (challenge.value !== givenChallenge) {
        return false;
      }
      await challengeRepository.delete(challenge.id);
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

  const { id: sessionId } = await sessionRepository.create({ groupId });

  const { newCounter } = authenticationInfo;

  await groupRepository.update(group.id, {
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
      createSessionKeyCookie(sessionId, { cookieDomain, sessionTtl, cookieSecret }),
      createSessionCookie({ cookieDomain, sessionTtl }),
      createGroupCookie(groupId, { cookieDomain, cookieSecret })
    ]
  };
};

app.http('verifyAuthentication', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(verifyAuthentication)
});
