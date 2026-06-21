"use client";

import { Loader2 } from "lucide-react";

interface Props {
  message?: string;
}

/** A branded full-screen overlay for significant transitions (e.g. creating a
 *  workspace and being redirected into it) — smaller in-context actions
 *  (Save, generate, upload) keep their existing inline spinners instead. */
export default function FullScreenLoader({ message = "Loading…" }: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-sm animate-fade-in-up">
      <div className="w-14 h-14 bg-primary text-black rounded-2xl flex items-center justify-center shadow-xl">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
}
