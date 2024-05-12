import { app } from '@azure/functions';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server/script/deps';
import { z } from 'zod';
import { appContext } from '../../appContext';
import type { RequestHandler } from '../../handler';
import { createRequestHandler } from '../../handler';
import { createGroupCookie, createSessionCookie, createSessionKeyCookie, getGroupIdFromCookie } from '../cookie';

const requestBodySchema = z.object({
  groupId: z.string().uuid()
    .optional(),
  authenticationResponse: z.object({}).passthrough()
    .transform(value => value as unknown as AuthenticationResponseJSON)
});

const verifyAuthentication: RequestHandler = async ({ request, appContext }) => {
  const groupRepository = await appContext.groupRepository;
  const challengeRepository = await appContext.challengeRepository;
  const sessionRepository = await appContext.sessionRepository;
  const { rpId, allowedOrigin, sessionTtl, cookieDomain, cookieSecret } = appContext.authenticationConfig;

  const { groupId: groupIdFromRequestBody, authenticationResponse } = requestBodySchema.parse(await request.json());

  const groupId = groupIdFromRequestBody ?? getGroupIdFromCookie(request, { cookieSecret });

  if (groupId === null) {
    throw new Error('group ID provided');
  }

  const group = await groupRepository.get(groupId);

  if (group === null) {
    throw new Error(`unknown group ID ${groupId}`);
  }

  const usedAuthenticator = group.authenticators.find(({ credentialId }) => credentialId === authenticationResponse.id);

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
    authenticator: {
      ...usedAuthenticator,
      credentialID: usedAuthenticator.credentialId,
      credentialPublicKey: isoBase64URL.toBuffer(usedAuthenticator.credentialPublicKey),
    }
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
  handler: createRequestHandler(appContext, verifyAuthentication)
});
