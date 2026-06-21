"use client";

import { useState } from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { getAccessToken } from "@/lib/supabase/client";

interface Result {
  name: string;
  tagline: string;
}

interface Props {
  /** Called after a name is successfully saved, so the dashboard can refresh its list. */
  onSaved: () => void;
}

/**
 * A de-emphasized alternative to the full workspace-creation flow: generate a
 * few name+tagline ideas from a one-line prompt and save one directly as a
 * brand (name + tagline only, no AI palette/guideline, no redirect) without
 * leaving the dashboard. Reuses /api/generate-names and /api/brands/create —
 * saved brands are normal rows, just emptier, editable later like any other.
 */
export default function QuickNameSave({ onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setIsGenerating(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          (data?.error && typeof data.error === "object" && data.error.message) ||
          "Failed to generate names";
        throw new Error(msg);
      }
      if (Array.isArray(data.items)) setResults(data.items.slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (result: Result, index: number) => {
    setSavingIndex(index);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Please sign in to save a name.");
        return;
      }
      const res = await fetch("/api/brands/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: result.name, tagline: result.tagline }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Could not save name");
      }
      setSavedIndexes((prev) => new Set(prev).add(index));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSavingIndex(null);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 hover:border-primary hover:text-primary transition-colors"
      >
        Just save a name idea
      </button>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-gray-300 dark:border-gray-700 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Just save a name idea
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Close
        </button>
      </div>
      <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2">
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="A one-line idea, e.g. a coffee subscription for remote workers"
          className="flex-1 px-3 py-2.5 text-sm bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary"
        />
        <button
          type="submit"
          disabled={isGenerating || !idea.trim()}
          className="flex items-center justify-center gap-2 bg-primary text-black px-4 py-2.5 rounded-xl font-semibold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate
        </button>
      </form>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map((r, i) => {
            const saved = savedIndexes.has(i);
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-[#151515]"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{r.name}</div>
                  <div className="text-xs text-gray-400 truncate">{r.tagline}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave(r, i)}
                  disabled={savingIndex === i || saved}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black active:scale-95 transition-colors disabled:opacity-60"
                >
                  {saved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Saved
                    </>
                  ) : savingIndex === i ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
