import { app } from '@azure/functions';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { RequestHandler, createRequestHandler } from '../../handler';
import { getGroupIdFromCookie } from '../cookie';
import { Group } from '../model';

const getAuthenticationOptions: RequestHandler = async ({ request, env }) => {
  const groupRepository = await env.get('groupRepository');
  const challengeRepository = await env.get('challengeRepository');
  const { rpId, cookieSecret } = env.get('authenticationConfig');

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
    throw new Error(`cannot find group by neither group ID (${groupId}) nor invitation code (${invitationCode})`);
  }

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    allowCredentials: group.authenticators.map(authenticator => ({
      id: isoBase64URL.toBuffer(authenticator.credentialId),
      type: 'public-key',
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
