// Supabase Storage helpers for brand assets.
//
// One public bucket, `brand-assets`. Logo binaries are uploaded client → Storage
// directly (anon key + the user's session; owner-only write is enforced by the RLS
// policy in 0002_brands.sql), so file bytes never pass through a Vercel serverless
// function — keeping us off Vercel's bandwidth/execution budget. The bucket is
// public-read, so an object's URL is deterministic from its path.

export const BRAND_ASSETS_BUCKET = "brand-assets";

/** ~2MB cap — keep in sync with the bucket's file-size limit in the dashboard. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** MIME allowlist — keep in sync with the bucket's allowed types. */
export const ALLOWED_LOGO_MIME = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
] as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export function extForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? "bin";
}

/**
 * Storage path for a brand logo. Convention `{owner_id}/{brand_id}/{file}` — the
 * first segment must equal auth.uid() for the Storage RLS write policy to allow it.
 */
export function brandLogoPath(ownerId: string, brandId: string, mime: string): string {
  return `${ownerId}/${brandId}/logo-${Date.now()}.${extForMime(mime)}`;
}

/** Public URL for an object in the brand-assets bucket (bucket is public-read). */
export function brandAssetPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  return `${base}/storage/v1/object/public/${BRAND_ASSETS_BUCKET}/${storagePath}`;
}
