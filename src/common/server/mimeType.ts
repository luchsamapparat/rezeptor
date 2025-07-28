/**
 * Checks if a given MIME type is accepted based on the configured accepted MIME types.
 * Supports wildcards (e.g., 'image/*') and specific sub-type matching
 * (e.g., 'application/ld+json' matches when 'application/json' is configured).
 */
export function isAcceptedMimeType(actualMimeType: string, acceptedMimeTypes: string[]): boolean {
  return acceptedMimeTypes.some((acceptedType) => {
    // Exact match
    if (actualMimeType === acceptedType) {
      return true;
    }

    // Wildcard match (e.g., 'image/*' matches 'image/png')
    if (acceptedType.endsWith('/*')) {
      const baseType = acceptedType.slice(0, -2);
      return actualMimeType.startsWith(baseType + '/');
    }

    // Special case: application/ld+json should match when application/json is configured
    if (acceptedType === 'application/json' && actualMimeType === 'application/ld+json') {
      return true;
    }

    return false;
  });
}
