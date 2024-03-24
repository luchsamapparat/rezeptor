import { app } from '@azure/functions';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { RequestHandler, createRequestHandler } from '../../handler';
import { createChallengeEntity } from '../infrastructure/persistence/challenge';
import { findGroupEntityByInvitationCode } from '../infrastructure/persistence/group';

const getRegistrationOptions: RequestHandler = async request => {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const { rpName, rpId } = appEnvironment.get('authenticationConfig');

  const formData = await request.formData();

  const invitationCode = getStringValue(formData, 'invitationCode');

  const group = await findGroupEntityByInvitationCode(groupContainer, invitationCode);

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userID: group.id,
    userName: group.name,
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: group.authenticators.map(({ credentialId, transports }) => ({
      id: isoBase64URL.toBuffer(credentialId),
      type: 'public-key',
      transports: transports
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    }
  });

  await createChallengeEntity(challengeContainer, {
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
  handler: createRequestHandler(getRegistrationOptions)
});
