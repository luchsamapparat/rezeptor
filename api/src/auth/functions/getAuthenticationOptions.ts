import { app } from '@azure/functions';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import type { RequestHandler } from '../../handler';
import { createRequestHandler } from '../../handler';
import { getGroupIdFromCookie, invalidateGroupCookie } from '../cookie';
import type { Group } from '../model';

const getAuthenticationOptions: RequestHandler = async ({ request, context, env }) => {
  const groupRepository = await env.get('groupRepository');
  const challengeRepository = await env.get('challengeRepository');
  const { rpId, cookieSecret, cookieDomain } = env.get('authenticationConfig');

  const formData = await request.formData();

  const groupId = getStringValue(formData, 'groupId', false) ?? getGroupIdFromCookie(request, { cookieSecret });
  const invitationCode = getStringValue(formData, 'invitationCode', false);

  let group: Group | null = null;

  if (groupId !== null) {
    group = await groupRepository.get(groupId);
  }

  if (invitationCode !== null) {
    group = await groupRepository.findByInvitationCode(invitationCode);
  }

  if (group === null) {
    context.error(`cannot find group by neither group ID (${groupId}) nor invitation code (${invitationCode})`);

    return {
      status: 400,
      cookies: [
        invalidateGroupCookie({ cookieDomain }),
      ]
    };
  }

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    allowCredentials: group.authenticators.map(authenticator => ({
      id: authenticator.credentialId,
      transports: authenticator.transports
    } as const)),
    userVerification: 'preferred',
  });

  await challengeRepository.create({
    groupId: group.id,
    value: options.challenge,
    type: 'authentication'
  });

  return {
    jsonBody: options
  };
};

app.http('getAuthenticationOptions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(appEnvironment, getAuthenticationOptions)
});
