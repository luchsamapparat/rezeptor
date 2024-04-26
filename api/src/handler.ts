import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import type { AppEnvironment } from './appEnvironment';
import { invalidateSessionCookie, invalidateSessionKeyCookie } from './auth/cookie';
import type { Session } from './auth/model';
import type { RequestEnvironment } from './requestEnvironment';
import { createRequestEnvironment } from './requestEnvironment';

type RequestContext = {
    request: HttpRequest;
    context: InvocationContext;
    env: AppEnvironment;
    requestEnv: RequestEnvironment;
};

type AuthenticatedRequestContext = RequestContext & {
    session: Session;
};

export type RequestHandler = (requestContext: RequestContext) => ReturnType<HttpHandler>;
export type AuthenticatedRequestHandler = (requestContext: AuthenticatedRequestContext) => ReturnType<HttpHandler>;

export function createRequestHandler(appEnvironment: AppEnvironment, handler: RequestHandler): HttpHandler {
  return (request, context) => {
    const requestEnvironment = createRequestEnvironment(request, appEnvironment);
    try {
      return handler({
        request,
        context,
        env: appEnvironment,
        requestEnv: requestEnvironment
      });
    } catch (error) {
      context.error(error);
      throw error;
    }
  };
}

export function createAuthenticatedRequestHandler(appEnvironment: AppEnvironment, handler: AuthenticatedRequestHandler): HttpHandler {
  return async (request, context) => {
    const authenticationConfig = appEnvironment.get('authenticationConfig');
    const requestEnvironment = createRequestEnvironment(request, appEnvironment);

    const session = await requestEnvironment.get('session');

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
        env: appEnvironment,
        requestEnv: requestEnvironment,
        session
      });
    } catch (error) {
      context.error(error);
      throw error;
    }
  };
}
