import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { AppEnvironment } from "./appEnvironment";
import { invalidateSessionCookie, invalidateSessionKeyCookie } from "./auth/cookie";
import { Session } from "./auth/model";
import { RequestEnvironment, createRequestEnvironment } from "./requestEnvironment";

type RequestContext = {
    request: HttpRequest;
    context: InvocationContext;
    env: AppEnvironment;
    requestEnv: RequestEnvironment;
}

type AuthenticatedRequestContext = RequestContext & {
    session: Session;
}

export type RequestHandler = (requestContext: RequestContext) => ReturnType<HttpHandler>;
export type AuthenticatedRequestHandler = (requestContext: AuthenticatedRequestContext) => ReturnType<HttpHandler>;

export function createRequestHandler(appEnvironment: AppEnvironment, handler: RequestHandler): HttpHandler {
    return (request, context) => {
        const requestEnvironment = createRequestEnvironment(request, appEnvironment);
        return handler({
            request,
            context,
            env: appEnvironment,
            requestEnv: requestEnvironment
        });
    };
}

export function createAuthenticatedRequestHandler(appEnvironment: AppEnvironment, handler: AuthenticatedRequestHandler): HttpHandler {
    return async (request, context) => {
        const authenticationConfig = appEnvironment.get('authenticationConfig');
        const requestEnvironment = createRequestEnvironment(request, appEnvironment);

        const session = await requestEnvironment.get('session');

        if (session === null) {
            return {
                status: 401,
                cookies: [
                    invalidateSessionKeyCookie(authenticationConfig),
                    invalidateSessionCookie(authenticationConfig),
                ]
            };
        }

        return handler({
            request,
            context,
            env: appEnvironment,
            requestEnv: requestEnvironment,
            session
        });
    };
}