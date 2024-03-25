import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { AppEnvironment, appEnvironment } from "./appEnvironment";
import { getSessionIdFromCookie, invalidateSessionCookie, invalidateSessionKeyCookie } from "./auth/cookie";
import { Session } from "./auth/model";

type AppContext = {
    env: AppEnvironment;
}

type AuthenticatedAppContext = AppContext & {
    session: Session;
}

export type RequestHandler = (request: HttpRequest, context: InvocationContext, appContent: AppContext) => ReturnType<HttpHandler>;
export type AuthenticatedRequestHandler = (request: HttpRequest, context: InvocationContext, appContent: AuthenticatedAppContext) => ReturnType<HttpHandler>;

export function createRequestHandler(handler: RequestHandler): HttpHandler {
    return (request, context) => handler(request, context, {
        env: appEnvironment
    });
}

export function createAuthenticatedRequestHandler(handler: AuthenticatedRequestHandler): HttpHandler {
    return async (request, context) => {
        const sessionRepository = await appEnvironment.get('sessionRepository');
        const authenticationConfig = appEnvironment.get('authenticationConfig');

        const sessionId = getSessionIdFromCookie(request, authenticationConfig);

        const session = (sessionId === null) ? null : await sessionRepository.get(sessionId)

        if (session === null) {
            return {
                status: 401,
                cookies: [
                    invalidateSessionKeyCookie(authenticationConfig),
                    invalidateSessionCookie(authenticationConfig),
                ]
            };
        }

        return handler(request, context, {
            env: appEnvironment,
            session
        });
    };
}