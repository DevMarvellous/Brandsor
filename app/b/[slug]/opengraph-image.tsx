import { getPublicBrand } from "@/lib/publicBrand";
import { renderBrandCardImage, BRAND_CARD_SIZE } from "@/lib/brandCardImage";

// Rendered on-demand per request (Next.js convention) — nothing to pre-generate or
// invalidate when a brand changes. Edge runtime: see lib/brandCardImage.tsx for why.
export const runtime = "edge";
export const alt = "Brand profile on Brandsor";
export const size = BRAND_CARD_SIZE;
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const brand = await getPublicBrand(params.slug);

  return renderBrandCardImage({
    name: brand?.name ?? "Brandsor",
    tagline: brand?.state.taglines?.[0] ?? "Your brand identity",
    palette: brand?.state.palette ?? [],
  });
}
