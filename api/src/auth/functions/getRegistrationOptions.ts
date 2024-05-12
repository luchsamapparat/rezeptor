import { app } from '@azure/functions';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { RequestHandler } from '../../handler';
import { createRequestHandler } from '../../handler';

const getRegistrationOptions: RequestHandler = async ({ request, appContext: env }) => {
  const groupRepository = await env.get('groupRepository');
  const challengeRepository = await env.get('challengeRepository');
  const { rpName, rpId } = env.get('authenticationConfig');

  const { invitationCode } = getRegistrationOptionsRequestBodySchema.parse(await request.formData());

  const group = await groupRepository.findByInvitationCode(invitationCode);

  if (group === null) {
    throw new Error(`cannot find group for invitation code (${invitationCode})`);
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userID: isoUint8Array.fromUTF8String(group.id),
    userName: group.name,
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: group.authenticators.map(({ credentialId, transports }) => ({
      id: credentialId,
      transports: transports
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    }
  });

  await challengeRepository.create({
    groupId: group.id,
    value: options.challenge,
    type: 'registration'
  });

  return {
    jsonBody: options
  };
};

app.http('getRegistrationOptions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(appContext, getRegistrationOptions)
});

const getRegistrationOptionsRequestBodySchema = zfd.formData({
  invitationCode: zfd.text()
});
