"use client";

import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { getAccessToken } from "@/lib/supabase/client";
import type { AssistField } from "@/lib/gemini";
import type { PaletteColor } from "@/lib/brands";

type Suggestion = string | PaletteColor;

interface Props {
  brandId: string;
  field: AssistField;
  /** Called when the founder clicks a suggestion to add it — never overwrites
   *  existing entries, the caller just appends. */
  onAdd: (suggestion: Suggestion) => void;
}

/** "Generate more with AI" — additive suggestions for taglines/altNames/palette. */
export default function AiAssistButton({ brandId, field, onAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setAddedIndexes(new Set());
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/brands/${brandId}/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ field }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Could not generate suggestions");
      }
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        Generate more with AI
      </button>

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map((s, i) => {
            const added = addedIndexes.has(i);
            const isColor = typeof s === "object";
            const label = isColor ? s.name || s.hex : s;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (added) return;
                  onAdd(s);
                  setAddedIndexes((prev) => new Set(prev).add(i));
                }}
                disabled={added}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  added
                    ? "border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-primary hover:text-primary"
                }`}
              >
                {isColor && (
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: s.hex }}
                  />
                )}
                {added ? (
                  "Added"
                ) : (
                  <>
                    <Plus className="w-3 h-3" /> {label}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
