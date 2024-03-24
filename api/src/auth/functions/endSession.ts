import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { RequestHandler, createRequestHandler } from '../../handler';
import { getSessionIdFromCookie, invalidateGroupCookie, invalidateSessionCookie, invalidateSessionKeyCookie } from '../cookie';
import { deleteSessionEntity } from '../infrastructure/persistence/session';

const endSession: RequestHandler = async request => {
  const sessionContainer = await appEnvironment.get('sessionContainer');
  const { cookieDomain, sessionKeySecret } = await appEnvironment.get('authenticationConfig');

  const sessionId = getSessionIdFromCookie(request, { sessionKeySecret });

  if (sessionId !== null) {
    await deleteSessionEntity(sessionContainer, sessionId);
  }

  return {
    status: 204,
    cookies: [
      invalidateSessionKeyCookie({ cookieDomain }),
      invalidateSessionCookie({ cookieDomain }),
      invalidateGroupCookie({ cookieDomain }),
    ]
  };
};

app.http('endSession', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createRequestHandler(endSession)
});
