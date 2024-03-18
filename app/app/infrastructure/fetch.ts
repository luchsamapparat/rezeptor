import { getApiBaseUrl } from "~/environment";

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
    return fetch(
        path,
        {
            ...init,
            headers: {
                ...init.headers,
                // Authorization: `bearer ${accessToken}`,
            }
        }
    )
}

export async function fetch(path: string, init: RequestInit = {}) {
    return window.fetch(
        `${getApiBaseUrl()}${path}`,
        init
    )
}