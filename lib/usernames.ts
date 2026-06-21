// Username validation — a unique account handle, separate from brand slugs
// (lib/brands.ts). Not used in any URL today; purely a display identity. See
// CLAUDE.md "User accounts" for the full design.

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const MAX_USERNAME = 20;

const RESERVED_USERNAMES = new Set<string>([
  "admin",
  "support",
  "root",
  "help",
  "api",
  "null",
  "undefined",
  "anonymous",
  "brandsor",
  "you",
  "me",
  "system",
]);

/** Days a user must wait between username changes (first-time set is exempt). */
export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;

export function isValidUsername(username: string): boolean {
  if (!USERNAME_RE.test(username.toLowerCase())) return false;
  return !RESERVED_USERNAMES.has(username.toLowerCase());
}

/** Normalize for storage: trim only — case is preserved for display, but
 * uniqueness is enforced case-insensitively at the database layer. */
export function normalizeUsername(input: string): string {
  return input.trim().slice(0, MAX_USERNAME);
}
