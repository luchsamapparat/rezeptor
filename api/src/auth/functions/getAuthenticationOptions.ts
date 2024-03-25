import { app } from '@azure/functions';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { RequestHandler, createRequestHandler } from '../../handler';
import { getGroupIdFromCookie } from '../cookie';
import { createChallengeEntity } from '../infrastructure/persistence/challenge';
import { findGroupEntityByInvitationCode, getGroupEntity } from '../infrastructure/persistence/group';
import { Group } from '../model';

const getAuthenticationOptions: RequestHandler = async request => {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const { rpId, cookieSecret } = appEnvironment.get('authenticationConfig');

  const formData = await request.formData();

  const groupId = getGroupIdFromCookie(request, { cookieSecret });
  const invitationCode = getStringValue(formData, 'invitationCode', false);

  let group: Group | null = null;

  if (groupId !== null) {
    group = await getGroupEntity(groupContainer, groupId);
  }

  if (invitationCode !== null) {
    group = await findGroupEntityByInvitationCode(groupContainer, invitationCode);
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

  await createChallengeEntity(challengeContainer, {
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
  handler: createRequestHandler(getAuthenticationOptions)
});
