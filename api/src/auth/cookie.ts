import { Container } from "@azure/cosmos";
import { Cookie, HttpRequest } from "@azure/functions";
import { parse } from 'cookie';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getSessionEntity } from "./infrastructure/persistence/session";
import { AuthenticationConfig, Group, Session } from "./model";

const sessionKeyCookieName = 'session-key';
const sessionCookieName = 'session';
const groupCookieName = 'group';

const encryptionAlgorithm = 'aes-256-cbc';

export async function getSessionFromCookie(sessionContainer: Container, request: HttpRequest, config: Pick<AuthenticationConfig, 'cookieSecret'>) {
    const sessionId = getSessionIdFromCookie(request, config);
    return (sessionId === null) ? null : getSessionEntity(sessionContainer, sessionId);
}

export function getSessionIdFromCookie(request: HttpRequest, config: Pick<AuthenticationConfig, 'cookieSecret'>) {
    return getEncryptedValueFromCookie(sessionKeyCookieName, request, config);
}

export function getGroupIdFromCookie(request: HttpRequest, config: Pick<AuthenticationConfig, 'cookieSecret'>) {
    return getEncryptedValueFromCookie(groupCookieName, request, config);
}

function getEncryptedValueFromCookie(cookieName: string, request: HttpRequest, { cookieSecret }: Pick<AuthenticationConfig, 'cookieSecret'>) {
    const cookieHeader = request.headers.get('cookie')

    if (cookieHeader === null) {
        return null;
    }

    const cookie = parse(cookieHeader);

    const encryptedValue = cookie[cookieName];

    if (encryptedValue === undefined) {
        return null;
    }

    return decrypt(encryptedValue, cookieSecret);
}

export function createSessionKeyCookie(sessionId: Session['id'], { cookieDomain, sessionTtl, cookieSecret }: Pick<AuthenticationConfig, 'cookieDomain' | 'sessionTtl' | 'cookieSecret'>) {
    return createCookie({
        name: sessionKeyCookieName,
        value: encrypt(sessionId, cookieSecret),
        domain: cookieDomain,
        httpOnly: true,
        maxAge: sessionTtl
    });
}

export function createSessionCookie({ cookieDomain, sessionTtl }: Pick<AuthenticationConfig, 'cookieDomain' | 'sessionTtl'>) {
    return createCookie({
        name: sessionCookieName,
        value: JSON.stringify({
            expiresAt: (new Date().getTime() / 1000) + sessionTtl
        }),
        domain: cookieDomain,
        httpOnly: false,
        maxAge: sessionTtl
    });
}

export function createGroupCookie(groupId: Group['id'], { cookieDomain, cookieSecret }: Pick<AuthenticationConfig, 'cookieDomain' | 'cookieSecret'>) {
    return createCookie({
        name: groupCookieName,
        value: encrypt(groupId, cookieSecret),
        domain: cookieDomain,
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 365
    });
}


export function invalidateSessionKeyCookie(config: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return invalidateCookie(sessionKeyCookieName, config);
}

export function invalidateSessionCookie(config: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return invalidateCookie(sessionCookieName, config);
}

export function invalidateGroupCookie(config: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return invalidateCookie(groupCookieName, config);
}

function invalidateCookie(name: string, { cookieDomain }: Pick<AuthenticationConfig, 'cookieDomain'>) {
    return createCookie({
        name,
        value: '',
        domain: cookieDomain,
        httpOnly: true,
        maxAge: 0
    });
}

const createCookie = ({ domain, ...cookie }: Pick<Cookie, 'name' | 'value' | 'domain' | 'httpOnly' | 'maxAge'>): Cookie => ({
    ...cookie,
    sameSite: (domain === 'localhost') ? 'Lax' : 'Strict',
    secure: true,
    domain: (domain === undefined || domain === 'localhost')
        ? undefined
        : domain.startsWith('.')
            ? domain
            : `.${domain}`,
} as const)

function encrypt(value: string, secret: string) {
    const initializationVector = randomBytes(16);
    const key = createHash('sha256').update(secret).digest('base64').substring(0, 32);
    const cipher = createCipheriv(encryptionAlgorithm, key, initializationVector);

    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return initializationVector.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(encryptedValue: string, secret: string) {
    const textParts = encryptedValue.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');

    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const key = createHash('sha256').update(secret).digest('base64').substr(0, 32);
    const decipher = createDecipheriv(encryptionAlgorithm, key, iv);

    const decrypted = decipher.update(encryptedData);
    const decryptedText = Buffer.concat([decrypted, decipher.final()]);
    return decryptedText.toString();
}