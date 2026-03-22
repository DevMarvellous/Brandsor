"use client";

import { useState } from "react";
import { Check, Copy, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";

interface Props {
  name: string;
  tagline: string;
  onSave?: (name: string, tagline: string) => void;
  onRemove?: () => void;
  isSavedInitial?: boolean;
}

export default function ResultCard({ name, tagline, onSave, onRemove, isSavedInitial = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(isSavedInitial);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${name} - ${tagline}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (saved) return;
    setSaved(true);
    if (onSave) onSave(name, tagline);
  };

  return (
    <div className="group relative bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md">
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleCopy} className="p-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors" title="Copy to clipboard">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        {onSave && (
          <button onClick={handleSave} className={`p-2 rounded-lg transition-colors ${saved ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'}`} title={saved ? "Saved" : "Save name"}>
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="p-2 bg-red-50 text-red-500 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Remove name">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <h3 className="text-2xl font-bold mb-2 text-black dark:text-white group-hover:text-primary transition-colors">{name}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{tagline}</p>
    </div>
  );
}
