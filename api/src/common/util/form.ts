import type { FormData } from 'undici';
import type { URLSearchParams } from 'url';

/** @scope * */
export function getStringValue(formData: FormData | URLSearchParams, name: string): string;
export function getStringValue(formData: FormData | URLSearchParams, name: string, throwIfMissing: true): string;
export function getStringValue(formData: FormData | URLSearchParams, name: string, throwIfMissing: false): string | null;
export function getStringValue(formData: FormData | URLSearchParams, name: string, throwIfMissing = true) {
  const value = formData.get(name) as string | null;

  if (value === null && throwIfMissing) {
    throw new Error(`${name} missing.`);
  }

  return value;
};

/** @scope * */
export const getFile = (formData: FormData, name: string) => {
  const file = formData.get(name) as unknown as File;

  if (file === null) {
    throw new Error(`${name} missing.`);
  }

  return file;
};
