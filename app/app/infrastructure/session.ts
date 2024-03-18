/* eslint-disable @typescript-eslint/no-unused-vars */
import { isEqual, isNull } from "lodash-es";
import { getSessionStorageKey } from "~/environment";

export type InvalidatedSession = {
    sessionId: null;
    groupId: string;
    expiresAt: null;
};

export type Session = {
    sessionId: string;
    groupId: string;
    expiresAt: number;
};

class SessionChangedEvent extends Event {
    constructor() {
        super('sessionChanged');
    }
}

class SessionStore extends EventTarget {
    #previouslyRetrievedSession: Session | InvalidatedSession | null = null;
    #storage: Storage;
    #storageKey: string;

    constructor(
        storage: Storage,
        storageKey: string
    ) {
        super();
        this.#storage = storage;
        this.#storageKey = storageKey;

        window.addEventListener('storage', event => {
            if (
                event.storageArea === window.localStorage &&
                event.key === getSessionStorageKey()
            ) {
                this.dispatchEvent(new SessionChangedEvent());
            }
        });
    }

    get(): Session | InvalidatedSession | null {
        const session = JSON.parse(this.#storage.getItem(this.#storageKey)!);

        if (isEqual(this.#previouslyRetrievedSession, session)) {
            return this.#previouslyRetrievedSession;
        } else {
            this.#previouslyRetrievedSession = session;
            return session;
        }
    }

    update(session: Session) {
        this.#set(session);
    }

    invalidate() {
        const session = this.get();

        if (isNull(session)) {
            return;
        }

        this.#set({
            ...session,
            sessionId: null,
            expiresAt: null
        });
    }

    clear() {
        this.#set(null);
    }

    #set(session: Session | InvalidatedSession | null) {
        this.#storage.setItem(this.#storageKey, JSON.stringify(session));
        this.dispatchEvent(new SessionChangedEvent());
    }
}

let sessionStore: SessionStore | null = null;

export function getSessionStore() {
    const isBrowser = !!window

    if (isNull(sessionStore) && isBrowser) {
        sessionStore = new SessionStore(window.localStorage, getSessionStorageKey())
    }

    return sessionStore;
}

export function isSessionValid(session: Session | InvalidatedSession | null): session is Session {
    if (isNull(session) || isInvalidatedSession(session)) {
        return false;
    }

    const now = (new Date().getTime() / 1000);
    return session.expiresAt > now;
}

const isInvalidatedSession = (session: Session | InvalidatedSession | null): session is InvalidatedSession => (
    !isNull(session) &&
    (
        isNull(session.sessionId) ||
        isNull(session.expiresAt)
    )
);
