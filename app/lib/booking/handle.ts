/**
 * Generate a URL-safe booking handle from a doctor's full name.
 * e.g. "Dr. Gabriel Xavier" → "dr-gabriel-xavier"
 */
export function generateHandle(fullName: string): string {
  const slug = fullName
    .toLowerCase()
    // strip leading "dr." or "dr " salutation
    .replace(/^dr\.?\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 29); // leave room for "dr-" prefix
  return "dr-" + slug;
}

/**
 * Append a random 4-digit suffix to a handle.
 * Used when the base handle is already taken.
 */
export function handleWithSuffix(base: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${base.substring(0, 32)}-${suffix}`;
}
