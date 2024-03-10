import { getApiBaseUrl } from "~/environment";

export async function fetch(path: string, init: RequestInit = {}) {
    return window.fetch(
        `${getApiBaseUrl()}${path}`,
        {
            ...init,
            headers: {
                ...init.headers,
                // Authorization: `bearer ${accessToken}`,
            }
        }
    )
}