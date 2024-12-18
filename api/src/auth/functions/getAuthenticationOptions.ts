import { app } from '@azure/functions';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { RequestHandler } from '../../handler';
import { createRequestHandler } from '../../handler';
import { getGroupIdFromCookie, invalidateGroupCookie } from '../cookie';
import type { Group } from '../model';

const getAuthenticationOptions: RequestHandler = async ({ request, context, appContext }) => {
  const groupRepository = await appContext.groupRepository;
  const challengeRepository = await appContext.challengeRepository;
  const { rpId, cookieSecret, cookieDomain } = appContext.authenticationConfig;

  const { invitationCode, ...formData } = getAuthenticationOptionsRequestBodySchema.parse(await request.formData());

  const groupId = formData.groupId ?? getGroupIdFromCookie(request, { cookieSecret });

  let group: Group | null = null;

  if (groupId !== null) {
    group = await groupRepository.get(groupId);
  }

  if (invitationCode !== undefined) {
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
  handler: createRequestHandler(appContext, getAuthenticationOptions)
});

const getAuthenticationOptionsRequestBodySchema = zfd.formData({
  groupId: z.string()
    .uuid()
    .optional(),
  invitationCode: zfd.text()
    .optional()
});
