import { HttpRequest } from "@azure/functions";
import { getSessionIdFromCookie } from "./cookie";
import { SessionRepository } from "./infrastructure/persistence/SessionRepository";
import { AuthenticationConfig } from "./model";

export async function getSessionFromRequest(sessionRepository: SessionRepository, authenticationConfig: AuthenticationConfig, request: HttpRequest) {
    const sessionId = getSessionIdFromCookie(request, authenticationConfig);
    return (sessionId === null) ? null : await sessionRepository.get(sessionId)
}
