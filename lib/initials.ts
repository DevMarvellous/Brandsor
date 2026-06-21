/** Two-letter initials for a navbar avatar, e.g. "Marvellous Adepoju" -> "MA". */
export function getInitials(name?: string | null, emailFallback?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const email = emailFallback?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}
