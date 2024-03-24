import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { isEmpty } from "lodash-es";
import { getCookie } from "react-use-cookie";
import { fetch } from "~/infrastructure/fetch";

export async function loginWithInvitationCode(invitationCode: string) {
    const groupId = await register(invitationCode);
    return login(groupId);
}

export async function loginWithGroupId(groupId: string) {
    return login(groupId);
}

async function login(groupId: string) {
    const authenticationOptionsResponse = await fetch('/getAuthenticationOptions', {
        method: 'POST',
        body: new URLSearchParams({ groupId })
    });

    const authenticationResponse = await startAuthentication(await authenticationOptionsResponse.json());

    const authenticationVerificationResponse = await fetch('/verifyAuthentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            groupId,
            authenticationResponse
        }),
    });

    if (!authenticationVerificationResponse.ok) {
        throw new Error('authentication verification failed');
    }
}

export async function logout() {
    await fetch('/endSession', {
        method: 'POST'
    });
}

async function register(invitationCode: string) {
    const registrationOptionsResponse = await fetch('/getRegistrationOptions', {
        method: 'POST',
        body: new URLSearchParams({ invitationCode })
    });

    const registrationResponse = await startRegistration(await registrationOptionsResponse.json());

    const authenticatorRegistrationResponse = await fetch('/registerAuthenticator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            invitationCode,
            registrationResponse
        }),
    });

    const { verified, groupId } = await authenticatorRegistrationResponse.json();

    if (!verified) {
        throw new Error('authenticator registration failed');
    }

    return groupId as string;
}

export function isAuthenticated() {
    return !isSessionExpired(getSessionFromCookie());
}

type Session = { expiresAt: number };

function getSessionFromCookie() {
    const stringifiedSession = getCookie('session');
    return isEmpty(stringifiedSession) ? null : JSON.parse(stringifiedSession) as Session
}

function getGroupIdFromCookie() {
    const stringifiedGroupId = getCookie('group');
    return isEmpty(stringifiedGroupId) ? null : stringifiedGroupId;
}

export { getGroupIdFromCookie as getGroupId };

function isSessionExpired(session: Session | null) {
    if (session === null) {
        return true;
    }
    const now = (new Date().getTime() / 1000);
    return session.expiresAt < now;
}
