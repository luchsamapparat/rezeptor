import { AuthenticatorDevice, AuthenticatorTransportFuture, CredentialDeviceType } from "@simplewebauthn/types";
import { EntityId } from "../common/infrastructure/persistence/azureCosmosDb";
import { Model } from "../common/model";

export type AuthenticationConfig = {
    rpName: string;
    rpId: string;
    allowedOrigin: string;
    challengeTtl: number;
    sessionTtl: number;
};

export type Group = Model<{
    name: string;
    invitationCode: string;
    authenticators: Authenticator[];
}>;

export type Authenticator = {
    credentialId: Uint8Array;
    credentialPublicKey: Uint8Array;
    counter: number;
    credentialDeviceType: CredentialDeviceType;
    credentialBackedUp: boolean;
    transports?: AuthenticatorTransportFuture[];
};

export const toAuthenticatorDevice = ({ credentialId, ...authenticator }: Authenticator): AuthenticatorDevice => ({
    ...authenticator,
    credentialID: credentialId
});

export type Challenge = Model<{
    groupId: EntityId;
    value: string;
    type: 'registration' | 'authentication';
}>;

export type Session = Model<{
    groupId: EntityId;
}>;