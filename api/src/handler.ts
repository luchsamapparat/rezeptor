import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import type { AppContext } from './appContext';
import { invalidateSessionCookie, invalidateSessionKeyCookie } from './auth/cookie';
import type { Session } from './auth/model';
import type { RequestContext } from './requestContext';
import { createRequestContext } from './requestContext';

type HandlerContext = {
  request: HttpRequest;
  context: InvocationContext;
  appContext: AppContext;
  requestContext: RequestContext;
};

type AuthenticatedHandlerContext = HandlerContext & {
  session: Session;
};

export type RequestHandler = (context: HandlerContext) => ReturnType<HttpHandler>;
export type AuthenticatedRequestHandler = (context: AuthenticatedHandlerContext) => ReturnType<HttpHandler>;

export function createRequestHandler(appContext: AppContext, handler: RequestHandler): HttpHandler {
  return (request, context) => {
    const requestContext = createRequestContext(request, appContext);
    try {
      return handler({
        request,
        context,
        appContext,
        requestContext
      });
    } catch (error) {
      context.error(error);
      throw error;
    }
  };
}

export function createAuthenticatedRequestHandler(appContext: AppContext, handler: AuthenticatedRequestHandler): HttpHandler {
  return async (request, context) => {
    const { authenticationConfig } = appContext;
    const requestContext = createRequestContext(request, appContext);

    const session = await requestContext.session;

    if (session === null) {
      context.error(`Failed to authenticate ${request.method.toUpperCase()} ${request.url}. No session found.`);
      return {
        status: 401,
        cookies: [
          invalidateSessionKeyCookie(authenticationConfig),
          invalidateSessionCookie(authenticationConfig),
        ]
      };
    }

    context.trace(`Authenticated group ${session.groupId} for ${request.method.toUpperCase()} ${request.url}`);

    try {
      return handler({
        request,
        context,
        appContext,
        requestContext,
        session
      });
    } catch (error) {
      context.error(error);
      throw error;
    }
  };
}
