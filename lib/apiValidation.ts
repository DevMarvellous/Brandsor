export function normalizeOptionalString(
  value: unknown,
  maxLength: number
): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function requiredString(
  value: unknown,
  maxLength: number
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
