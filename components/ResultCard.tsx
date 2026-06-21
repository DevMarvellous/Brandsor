"use client";

import { useState } from "react";
import { Check, Copy, Trash2, Sparkles, Loader2 } from "lucide-react";

interface Props {
  name: string;
  tagline: string;
  onRemove?: () => void;
  onCreateBrand?: (name: string, tagline: string) => Promise<void> | void;
}

export default function ResultCard({ name, tagline, onRemove, onCreateBrand }: Props) {
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateBrand = async () => {
    if (creating || !onCreateBrand) return;
    setCreating(true);
    try {
      await onCreateBrand(name, tagline);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${name} - ${tagline}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Always visible — opacity-0/group-hover would never reveal on touch
            devices (phones, and many tablets even at sm:+ widths), making
            copy/remove unreachable without a mouse. */}
        <button onClick={handleCopy} className="p-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors" title="Copy to clipboard">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        {onRemove && (
          <button onClick={onRemove} className="p-2 bg-red-50 text-red-500 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Remove name">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <h3 className="text-2xl font-bold mb-2 pr-20 text-black dark:text-white group-hover:text-primary transition-colors">{name}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{tagline}</p>

      {onCreateBrand && (
        <button
          onClick={handleCreateBrand}
          disabled={creating}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          title="Create a brand workspace from this name"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating brand…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Create Brand from This
            </>
          )}
        </button>
      )}
    </div>
  );
}
