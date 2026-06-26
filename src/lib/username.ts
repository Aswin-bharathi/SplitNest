/** Derive login username from display name: lowercase, no spaces or special chars. */
export function nameToUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}
