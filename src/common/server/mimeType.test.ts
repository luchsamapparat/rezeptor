import { describe, expect, it } from 'vitest';
import { isAcceptedMimeType } from './mimeType';

describe('isAcceptedMimeType', () => {
  it('should match exact MIME types', () => {
    expect(isAcceptedMimeType('image/png', ['image/png'])).toBe(true);
    expect(isAcceptedMimeType('application/json', ['application/json'])).toBe(true);
    expect(isAcceptedMimeType('image/png', ['image/jpeg'])).toBe(false);
  });

  it('should match wildcard MIME types', () => {
    expect(isAcceptedMimeType('image/png', ['image/*'])).toBe(true);
    expect(isAcceptedMimeType('image/jpeg', ['image/*'])).toBe(true);
    expect(isAcceptedMimeType('image/gif', ['image/*'])).toBe(true);
    expect(isAcceptedMimeType('application/json', ['image/*'])).toBe(false);
  });

  it('should handle multiple accepted types', () => {
    const acceptedTypes = ['image/*', 'application/pdf'];
    expect(isAcceptedMimeType('image/png', acceptedTypes)).toBe(true);
    expect(isAcceptedMimeType('application/pdf', acceptedTypes)).toBe(true);
    expect(isAcceptedMimeType('text/plain', acceptedTypes)).toBe(false);
  });

  it('should match application/ld+json when application/json is configured', () => {
    expect(isAcceptedMimeType('application/ld+json', ['application/json'])).toBe(true);
    expect(isAcceptedMimeType('application/json', ['application/json'])).toBe(true);
  });

  it('should not match invalid patterns', () => {
    // Invalid MIME type format like 'image/' should not match anything
    expect(isAcceptedMimeType('image/png', ['image/'])).toBe(false);

    // Only exact matches and proper wildcards should work
    expect(isAcceptedMimeType('image/png', ['image'])).toBe(false);
  });
});