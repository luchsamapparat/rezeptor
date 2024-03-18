import { isoBase64URL } from "@simplewebauthn/server/helpers";
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
    credentialId: string;
    credentialPublicKey: string;
    counter: number;
    credentialDeviceType: CredentialDeviceType;
    credentialBackedUp: boolean;
    transports?: AuthenticatorTransportFuture[];
};

export const toAuthenticatorDevice = ({ credentialId, credentialPublicKey, ...authenticator }: Authenticator): AuthenticatorDevice => ({
    ...authenticator,
    credentialID: isoBase64URL.toBuffer(credentialId),
    credentialPublicKey: isoBase64URL.toBuffer(credentialPublicKey)
});

export type Challenge = Model<{
    groupId: EntityId;
    value: string;
    type: 'registration' | 'authentication';
}>;

export type Session = Model<{
    groupId: EntityId;
}>;