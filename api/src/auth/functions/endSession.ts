import { app } from '@azure/functions';
import { appContext } from '../../appContext';
import type { RequestHandler } from '../../handler';
import { createRequestHandler } from '../../handler';
import { getSessionIdFromCookie, invalidateGroupCookie, invalidateSessionCookie, invalidateSessionKeyCookie } from '../cookie';

const endSession: RequestHandler = async ({ request, appContext }) => {
  const sessionRepository = await appContext.sessionRepository;
  const { cookieDomain, cookieSecret } = appContext.authenticationConfig;

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
  handler: createRequestHandler(appContext, endSession)
});
