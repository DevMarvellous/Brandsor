// Curated Google Font pairings for the typography picker. v1 keeps this to a
// hand-picked shortlist (NOT a full font manager — custom uploads are out of scope).
// Every family here is a free Google Font; the workspace and public profile load
// only the families actually in use via Google Fonts CSS.

export interface FontPairing {
  id: string;
  label: string;
  headingFont: string;
  bodyFont: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: "poppins-inter", label: "Poppins · Inter", headingFont: "Poppins", bodyFont: "Inter" },
  { id: "playfair-inter", label: "Playfair Display · Inter", headingFont: "Playfair Display", bodyFont: "Inter" },
  { id: "montserrat-merriweather", label: "Montserrat · Merriweather", headingFont: "Montserrat", bodyFont: "Merriweather" },
  { id: "spacegrotesk-inter", label: "Space Grotesk · Inter", headingFont: "Space Grotesk", bodyFont: "Inter" },
  { id: "dmserif-dmsans", label: "DM Serif Display · DM Sans", headingFont: "DM Serif Display", bodyFont: "DM Sans" },
  { id: "fraunces-nunito", label: "Fraunces · Nunito Sans", headingFont: "Fraunces", bodyFont: "Nunito Sans" },
  { id: "archivo-libre", label: "Archivo · Libre Franklin", headingFont: "Archivo", bodyFont: "Libre Franklin" },
  { id: "sora-ibmplex", label: "Sora · IBM Plex Sans", headingFont: "Sora", bodyFont: "IBM Plex Sans" },
  { id: "bricolage-worksans", label: "Bricolage Grotesque · Work Sans", headingFont: "Bricolage Grotesque", bodyFont: "Work Sans" },
  { id: "lora-sourcesans", label: "Lora · Source Sans 3", headingFont: "Lora", bodyFont: "Source Sans 3" },
];

/** Every distinct family referenced above — used to build a Google Fonts CSS URL. */
export function allPairingFamilies(): string[] {
  const set = new Set<string>();
  for (const p of FONT_PAIRINGS) {
    set.add(p.headingFont);
    set.add(p.bodyFont);
  }
  return Array.from(set);
}

/**
 * Build a Google Fonts CSS2 URL for the given families (regular + 600/700 weights).
 * Pass a small list (e.g. the two fonts a public profile uses) to keep it light.
 */
export function googleFontsHref(families: string[]): string {
  if (families.length === 0) return "";
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
