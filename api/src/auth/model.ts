import type { AuthenticatorTransportFuture, CredentialDeviceType } from '@simplewebauthn/types';
import type { EntityId } from '../common/infrastructure/persistence/azureCosmosDb';
import type { Model } from '../common/model';

/** @scope * */
export type AuthenticationConfig = {
  rpName: string;
  rpId: string;
  allowedOrigin: string;
  challengeTtl: number;
  sessionTtl: number;
  cookieSecret: string;
  cookieDomain: string;
};

export type Group = Model<{
  name: string;
  invitationCode: string;
  authenticators: Authenticator[];
}>;

export type Ownership = readonly [
  ['groupId', Group['id']]
];

export type OwnedByGroup<T> = T & Ownership;

export type Authenticator = {
  credentialId: string;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: CredentialDeviceType;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
};

export type Challenge = Model<{
  groupId: EntityId;
  value: string;
  type: 'registration' | 'authentication';
}>;

/** @scope * */
export type Session = Model<{
  groupId: EntityId;
}>;

/** @scope * */
export const getOwnership = ({ groupId }: Session): Ownership => [
  ['groupId', groupId]
];

/** @scope * */
export const toOwnershipProperties = (ownership: Ownership) => Object.fromEntries(ownership);
