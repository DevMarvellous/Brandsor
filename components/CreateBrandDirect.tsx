"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  onCreate: (name: string, tagline: string) => Promise<void> | void;
}

/**
 * Lets a user create a brand from a name they already have — AI generation is
 * one path into a brand, not the only one.
 */
export default function CreateBrandDirect({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim(), tagline.trim());
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 mb-8 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4" /> Already have a name? Create a brand directly
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 p-4 sm:p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-gray-800 flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Brand name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme"
          autoFocus
          className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tagline (optional)
        </label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One line about it"
          className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary"
        />
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-500 hover:text-black dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {submitting ? "Creating…" : "Create Brand"}
        </button>
      </div>
    </form>
  );
}
