import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { createChallengeEntity } from '../infrastructure/persistence/challenge';
import { getGroupEntity } from '../infrastructure/persistence/group';

export async function getAuthenticationOptions(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const groupContainer = await appEnvironment.get('groupContainer');
  const challengeContainer = await appEnvironment.get('challengeContainer');
  const { rpId } = appEnvironment.get('authenticationConfig');

  const formData = await request.formData();

  const groupId = getStringValue(formData, 'groupId');

  const group = await getGroupEntity(groupContainer, groupId);

  if (group === undefined) {
    throw new Error(`unknown group ID ${groupId}`);
  }

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    allowCredentials: group.authenticators.map(authenticator => ({
      id: authenticator.credentialId,
      type: 'public-key',
      transports: authenticator.transports
    })),
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
  handler: getAuthenticationOptions
});
