import { ImageResponse } from "next/og";

// Shared 1200x630 brand-card renderer — used both by the public OG image
// (app/b/[slug]/opengraph-image.tsx) and the authenticated "download my card"
// export (app/api/brands/[id]/card/route.tsx), so a private, not-yet-public
// brand can still be exported as an image. Built-in system font, no font
// fetch, nothing stored or invalidated.
export const BRAND_CARD_SIZE = { width: 1200, height: 630 };

export function renderBrandCardImage(input: {
  name: string;
  tagline?: string | null;
  palette: { hex: string }[];
}) {
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
          fontFamily: "sans-serif",
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
    { ...BRAND_CARD_SIZE }
  );
}
