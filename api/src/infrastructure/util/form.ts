import type { FormData } from 'undici';
import { URLSearchParams } from 'url';

export const getStringValue = (formData: FormData | URLSearchParams, name: string) => {
    const value = formData.get(name) as string;

    if (value === null) {
        throw new Error(`${name} missing.`)
    }

    return value;
};

export const getFile = (formData: FormData, name: string) => {
    const file = formData.get(name) as unknown as File;

    if (file === null) {
        throw new Error(`${name} missing.`)
    }

    return file;
};