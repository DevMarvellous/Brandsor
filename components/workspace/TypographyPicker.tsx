"use client";

import { useState } from "react";
import { Check, Sparkles, Pencil } from "lucide-react";
import { FONT_PAIRINGS, allPairingFamilies, googleFontsHref } from "@/lib/fontPairings";
import type { Typography } from "@/lib/brands";

interface Props {
  typography: Typography | null;
  onChange: (typography: Typography | null) => void;
  recommendedId?: string | null;
}

// Load every curated family once so the previews render in their real typefaces.
// (Public profiles load only the two fonts in use — see Phase 4.)
const FONTS_HREF = googleFontsHref(allPairingFamilies());

export default function TypographyPicker({ typography, onChange, recommendedId }: Props) {
  const selectedId = FONT_PAIRINGS.find(
    (p) => p.headingFont === typography?.headingFont && p.bodyFont === typography?.bodyFont
  )?.id;
  const selected = FONT_PAIRINGS.find((p) => p.id === selectedId);

  // Collapses to just the selection once one is picked — the full grid only
  // shows on first pick or after explicitly clicking "Change" (otherwise all
  // 10 previews eat most of the screen for no reason once you're done).
  const [expanded, setExpanded] = useState(!selected);

  if (selected && !expanded) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS_HREF} />
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-primary bg-primary/5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Check className="w-3.5 h-3.5 text-primary" /> {selected.label}
            </div>
            <div
              className="text-xl font-bold text-black dark:text-white truncate"
              style={{ fontFamily: `'${selected.headingFont}', sans-serif` }}
            >
              {selected.headingFont}
            </div>
            <div
              className="text-sm text-gray-500 dark:text-gray-400 truncate"
              style={{ fontFamily: `'${selected.bodyFont}', sans-serif` }}
            >
              The quick brown fox jumps over the lazy dog.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" /> Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONTS_HREF} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FONT_PAIRINGS.map((p) => {
          const active = p.id === selectedId;
          const recommended = p.id === recommendedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (active) {
                  onChange(null);
                  return;
                }
                onChange({ headingFont: p.headingFont, bodyFont: p.bodyFont });
                setExpanded(false);
              }}
              className={`text-left p-4 rounded-2xl border transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{p.label}</span>
                {active ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : recommended ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </span>
                ) : null}
              </div>
              <div
                className="text-xl font-bold text-black dark:text-white"
                style={{ fontFamily: `'${p.headingFont}', sans-serif` }}
              >
                {p.headingFont}
              </div>
              <div
                className="text-sm text-gray-500 dark:text-gray-400"
                style={{ fontFamily: `'${p.bodyFont}', sans-serif` }}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
