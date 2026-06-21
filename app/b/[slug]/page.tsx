import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { getPublicBrand } from "@/lib/publicBrand";
import { googleFontsHref } from "@/lib/fontPairings";

// Always render fresh so a brand's latest saved state shows immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const brand = await getPublicBrand(params.slug);
  if (!brand) return { title: "Not found · Brandsor" };
  const description = brand.state.taglines?.[0] || `${brand.name} — a brand on Brandsor.`;
  return {
    title: `${brand.name} · Brandsor`,
    description,
    openGraph: { title: brand.name, description, type: "profile" },
    twitter: { card: "summary_large_image", title: brand.name, description },
  };
}

function guidelinesHtml(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  try {
    return generateHTML(doc as Parameters<typeof generateHTML>[0], [StarterKit]);
  } catch {
    return "";
  }
}

export default async function PublicBrandPage({
  params,
}: {
  params: { slug: string };
}) {
  const brand = await getPublicBrand(params.slug);
  if (!brand) notFound();

  const { name, state, logoUrl } = brand;
  const heading = state.typography?.headingFont;
  const body = state.typography?.bodyFont;
  const fontFamilies = [heading, body].filter(Boolean) as string[];
  const headingStyle = heading ? { fontFamily: `'${heading}', sans-serif` } : undefined;
  const bodyStyle = body ? { fontFamily: `'${body}', sans-serif` } : undefined;
  const html = guidelinesHtml(state.guidelines);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white" style={bodyStyle}>
      {fontFamilies.length > 0 && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={googleFontsHref(fontFamilies)} />
      )}

      <main className="max-w-2xl mx-auto px-5 py-16 sm:py-24">
        {/* Header */}
        <header className="flex flex-col items-center text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="w-24 h-24 object-contain rounded-2xl mb-6"
            />
          )}
          <h1 className="text-4xl sm:text-5xl font-bold" style={headingStyle}>
            {name}
          </h1>
          {state.taglines?.[0] && (
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">{state.taglines[0]}</p>
          )}
          {state.taglines.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {state.taglines.slice(1).map((t, i) => (
                <span
                  key={i}
                  className="text-sm text-gray-400 dark:text-gray-500 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Palette */}
        {state.palette.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4" style={headingStyle}>
              Palette
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {state.palette.map((c, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="h-20" style={{ backgroundColor: c.hex }} />
                  <div className="px-3 py-2">
                    {c.name && <div className="text-sm font-medium truncate">{c.name}</div>}
                    <div className="text-xs text-gray-400 uppercase">{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Typography */}
        {state.typography && (
          <section className="mt-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4" style={headingStyle}>
              Typography
            </h2>
            <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div>
                <div className="text-xs text-gray-400 mb-1">Heading · {state.typography.headingFont}</div>
                <div className="text-3xl font-bold" style={headingStyle}>
                  {name}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Body · {state.typography.bodyFont}</div>
                <p className="text-gray-600 dark:text-gray-300" style={bodyStyle}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Guidelines */}
        {html && (
          <section className="mt-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4" style={headingStyle}>
              Guidelines
            </h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              style={bodyStyle}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </section>
        )}

        {/* Growth loop */}
        <footer className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
          >
            Created with <span className="font-semibold text-primary">Brandsor</span>
          </Link>
        </footer>
      </main>
    </div>
  );
}
