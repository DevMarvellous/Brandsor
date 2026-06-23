import { ImageResponse } from "next/og";

// Shared 1200x630 brand-card renderer — used both by the public OG image
// (app/b/[slug]/opengraph-image.tsx) and the authenticated "download my card"
// export (app/api/brands/[id]/card/route.tsx), so a private, not-yet-public
// brand can still be exported as an image.
//
// Both call sites run on the EDGE runtime deliberately: the Node build of
// @vercel/og eagerly loads its own bundled default font on import via a path
// resolution that is broken on Windows local dev (ERR_INVALID_URL on
// noto-sans-...ttf), which 500s the route. The edge build doesn't do that — but
// it ships no system fonts, so we must supply our own. We bundle Inter (loaded
// once below via `fetch(new URL(.., import.meta.url))`, the pattern Next's asset
// tracer recognizes) and reuse it across renders.
export const BRAND_CARD_SIZE = { width: 1200, height: 630 };

type CardFont = {
  name: "Inter";
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

// Module-level so the fonts are fetched once per worker, not per request.
const fontsPromise: Promise<CardFont[]> = Promise.all([
  fetch(new URL("./fonts/Inter-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL("./fonts/Inter-Bold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
])
  .then(([regular, bold]): CardFont[] => [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
  ])
  .catch(() => []);

export async function renderBrandCardImage(input: {
  name: string;
  tagline?: string | null;
  palette: { hex: string }[];
}): Promise<ImageResponse> {
  const fonts = await fontsPromise;
  const palette = input.palette.slice(0, 6);
  const accent = palette[0]?.hex ?? "#F2A900";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f0f0f",
          color: "white",
          padding: "80px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: accent,
            }}
          />
          <div style={{ fontSize: "28px", color: "#a1a1aa" }}>Brandsor</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "84px", fontWeight: 700, lineHeight: 1.05 }}>
            {input.name}
          </div>
          {input.tagline && (
            <div style={{ fontSize: "34px", color: "#a1a1aa", marginTop: "20px" }}>
              {input.tagline.length > 90 ? `${input.tagline.slice(0, 90)}…` : input.tagline}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          {palette.length > 0 ? (
            palette.map((c, i) => (
              <div
                key={i}
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "16px",
                  background: c.hex,
                }}
              />
            ))
          ) : (
            <div style={{ fontSize: "26px", color: "#71717a" }}>
              A complete brand identity
            </div>
          )}
        </div>
      </div>
    ),
    { ...BRAND_CARD_SIZE, fonts }
  );
}
