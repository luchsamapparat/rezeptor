import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { AppEnvironment, appEnvironment } from "./appEnvironment";
import { getSessionFromCookie } from "./auth/cookie";
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
        const sessionContainer = await appEnvironment.get('sessionContainer');
        const session = await getSessionFromCookie(sessionContainer, request);

        if (session === null) {
            return {
                status: 401
            };
        }

        return handler(request, context, {
            env: appEnvironment,
            session
        });
    };
}