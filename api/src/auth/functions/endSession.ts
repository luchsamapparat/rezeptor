import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { RequestHandler, createRequestHandler } from '../../handler';
import { getSessionIdFromCookie, invalidateGroupCookie, invalidateSessionCookie, invalidateSessionKeyCookie } from '../cookie';

const endSession: RequestHandler = async request => {
  const sessionRepository = await appEnvironment.get('sessionRepository');
  const { cookieDomain, cookieSecret } = appEnvironment.get('authenticationConfig');

  const sessionId = getSessionIdFromCookie(request, { cookieSecret });

  if (sessionId !== null) {
    await sessionRepository.delete(sessionId);
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
