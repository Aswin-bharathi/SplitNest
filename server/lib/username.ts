/** Derive login username from display name: lowercase, no spaces or special chars. */
export function nameToUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

/** Normalize a login input (trim, lowercase, strip spaces). */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '');
}
