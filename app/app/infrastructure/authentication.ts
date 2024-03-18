import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useMemo, useSyncExternalStore } from "react";
import { fetch } from "~/infrastructure/fetch";
import { getSessionStore, isSessionValid } from "./session";


export async function loginWithInvitationCode(invitationCode: string) {
    const groupId = await register(invitationCode);
    return login(groupId);
}

export async function loginWithGroupId(groupId: string) {
    return login(groupId);
}

async function login(groupId: string) {
    const sessionStore = getSessionStore()!;
    const existingSession = sessionStore.get();

    if (isSessionValid(existingSession)) {
        throw new Error(`there is a valid session for group ID ${groupId}`);
    }

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

    const { verified, session } = await authenticationVerificationResponse.json();

    if (!verified) {
        throw new Error('authentication verfication failed');
    }

    sessionStore.update(session);
}

export async function logout() {
    const sessionStore = getSessionStore()!;
    const session = sessionStore.get();

    if (!isSessionValid(session)) {
        return;
    }

    await fetch('/endSession', {
        method: 'POST',
        body: new URLSearchParams({ sessionId: session.sessionId })
    });

    sessionStore.invalidate();
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
    return isSessionValid(getSessionStore()?.get() ?? null);
}

export const useSession = () => {
    const sessionStore = getSessionStore()!;

    const session = useSyncExternalStore(
        callback => {
            sessionStore.addEventListener('sessionChanged', callback);
            return () => sessionStore.removeEventListener('sessionChanged', callback);
        },
        () => sessionStore.get(),
        () => null
    );

    return useMemo(() => ({
        groupId: session?.groupId ?? null,
        isAuthenticated: isSessionValid(session)
    }), [session]);
}

