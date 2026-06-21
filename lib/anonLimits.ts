// Soft demo limit for anonymous name generation — a conversion nudge, not a
// security boundary (clearing localStorage resets it, and that's fine; the goal
// is to let people taste the product, not to enforce a hard quota).

export const ANON_GENERATION_LIMIT = 2;
const STORAGE_KEY = "anonGenerationCount";

export function getAnonGenerationCount(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

export function incrementAnonGenerationCount(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(getAnonGenerationCount() + 1));
  } catch {
    /* private mode / storage disabled — fail open, no demo limit applied */
  }
}
