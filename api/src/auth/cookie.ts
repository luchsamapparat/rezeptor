import { Container } from "@azure/cosmos";
import { HttpRequest } from "@azure/functions";
import { parse } from 'cookie';
import { getSessionEntity } from "./infrastructure/persistence/session";
import { AuthenticationConfig, Group, Session } from "./model";

const sessionCookieName = 'session';
const groupCookieName = 'group';

export async function getSessionFromCookie(sessionContainer: Container, request: HttpRequest) {
    const sessionId = getSessionIdFromCookie(request);
    return (sessionId === null) ? null : getSessionEntity(sessionContainer, sessionId);
}

export function getSessionIdFromCookie(request: HttpRequest) {
    const cookieHeader = request.headers.get('cookie')

    if (cookieHeader === null) {
        return null;
    }

    const cookie = parse(cookieHeader);

    const sessionId = cookie[sessionCookieName];

    if (sessionId === undefined) {
        return null;
    }

    return sessionId;
}

export function createSessionCookie(sessionId: Session['id'], { cookieDomain, sessionTtl }: Pick<AuthenticationConfig, 'cookieDomain' | 'sessionTtl'>) {
    return {
        name: sessionCookieName,
        value: sessionId,
        domain: cookieDomain,
        httpOnly: true,
        sameSite: 'Strict',
        secure: true,
        maxAge: sessionTtl
    } as const;
}

export function createGroupCookie(groupId: Group['id'], { cookieDomain }: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return {
        name: groupCookieName,
        value: groupId,
        domain: cookieDomain,
        httpOnly: false,
        sameSite: 'Strict',
        secure: true,
        maxAge: 60 * 60 * 24 * 365
    } as const;
}

export function invalidateSessionCookie(config: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return invalidateCookie(sessionCookieName, config);
}

export function invalidateGroupCookie(config: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return invalidateCookie(groupCookieName, config);
}

function invalidateCookie(name: string, { cookieDomain }: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return {
        name,
        value: '',
        domain: cookieDomain,
        httpOnly: true,
        sameSite: 'Strict',
        secure: true,
        maxAge: 0
    } as const;
}