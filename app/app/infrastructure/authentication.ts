import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/types";
import { isEmpty, isNull, isUndefined } from "lodash-es";
import { getCookie } from "react-use-cookie";
import { fetch } from "~/infrastructure/fetch";

export const loginWithCookie = () => login(undefined);
export const loginWithGroupId = (groupId: string) => login(groupId);

export async function loginWithInvitationCode(invitationCode: string) {
    const groupId = await register(invitationCode);
    return loginWithGroupId(groupId);
}

async function login(groupId?: string) {
    console.debug(`Retrieving authentication options${isUndefined(groupId) ? '' : ` for group ID ${groupId}`}.`);
    const authenticationOptionsResponse = await fetch('/getAuthenticationOptions', {
        method: 'POST',
        body: new URLSearchParams(isUndefined(groupId) ? {} : { groupId })
    });

    let authenticationResponse: AuthenticationResponseJSON;
    const publicKeyCredentialRequestOptions = await authenticationOptionsResponse.json();
    try {
        console.debug('Starting authentication.', publicKeyCredentialRequestOptions);
        authenticationResponse = await startAuthentication(publicKeyCredentialRequestOptions);
    } catch (error) {
        console.error('Authentication failed.', error);
        throw error;
    }

    const authenticationVerificationResponse = await fetch('/verifyAuthentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            groupId: groupId ?? undefined,
            authenticationResponse
        }),
    });

    if (!authenticationVerificationResponse.ok) {
        throw new Error('Authentication verification failed.');
    }
}

export async function logout() {
    await fetch('/endSession', {
        method: 'POST'
    });
}

async function register(invitationCode: string) {
    console.debug(`Retrieving registration options for invitation code ${invitationCode}.`);
    const registrationOptionsResponse = await fetch('/getRegistrationOptions', {
        method: 'POST',
        body: new URLSearchParams({ invitationCode })
    });

    let registrationResponse: RegistrationResponseJSON;
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptionsJSON = await registrationOptionsResponse.json();
    try {
        console.debug('Starting registration.', publicKeyCredentialCreationOptions);
        registrationResponse = await startRegistration(publicKeyCredentialCreationOptions);
    } catch (error) {
        console.error('Registration failed.', error);

        if (isInvalidStateError(error, 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED')) {
            const groupId = publicKeyCredentialCreationOptions.user.id;
            return groupId;
        }

        throw error;
    }

    console.debug(`Registering authenticator for invitation code ${invitationCode}.`, registrationResponse);
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
        throw new Error('Authenticator registration failed.');
    }

    return groupId as string;
}

const isInvalidStateError = (error: unknown, code: string) => {
    return (
        error instanceof Error &&
        error.name === 'InvalidStateError' &&
        'code' in error &&
        error.code === code
    );
}

export function isAuthenticated() {
    return !isSessionExpired(getSessionFromCookie());
}

type Session = { expiresAt: number };

function getSessionFromCookie() {
    const stringifiedSession = getCookie('session');
    return isEmpty(stringifiedSession) ? null : JSON.parse(stringifiedSession) as Session
}

function getGroupFromCookie() {
    const stringifiedGroup = getCookie('group');
    return isEmpty(stringifiedGroup) ? null : stringifiedGroup;
}

export function isRegisteredClient() {
    return !isNull(getGroupFromCookie());
}

function isSessionExpired(session: Session | null) {
    if (session === null) {
        return true;
    }
    const now = (new Date().getTime() / 1000);
    return session.expiresAt < now;
}
