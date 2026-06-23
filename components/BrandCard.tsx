"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Lock, ImageIcon, MoreVertical, Trash2 } from "lucide-react";
import type { PaletteColor } from "@/lib/brands";

export interface BrandCardData {
  id: string;
  name: string;
  slug: string;
  is_public: boolean;
  updated_at: string;
  palette: PaletteColor[];
  logoUrl: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return d === 1 ? "1 day ago" : `${d} days ago`;
  const h = Math.floor(diff / 3_600_000);
  if (h > 0) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  const m = Math.floor(diff / 60_000);
  if (m > 0) return m === 1 ? "1 min ago" : `${m} mins ago`;
  return "just now";
}

export default function BrandCard({
  brand,
  onRequestDelete,
}: {
  brand: BrandCardData;
  /** When provided, a "⋯" menu with Delete is shown; the parent owns the
   *  confirmation + API call so the card stays presentational. */
  onRequestDelete?: (brand: BrandCardData) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Link
      href={`/brands/${brand.id}`}
      className="group relative block bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151515] flex items-center justify-center overflow-hidden shrink-0">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <ImageIcon className="w-5 h-5 text-gray-300 dark:text-gray-600" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              brand.is_public
                ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                : "bg-gray-100 text-gray-500 dark:bg-[#2a2a2a]"
            }`}
          >
            {brand.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {brand.is_public ? "Public" : "Private"}
          </span>
          {onRequestDelete && (
            <button
              type="button"
              aria-label="Workspace actions"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-4 text-lg font-bold truncate group-hover:text-primary transition-colors">
        {brand.name}
      </h3>

      {brand.palette.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {brand.palette.slice(0, 8).map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-md border border-black/5"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">Updated {timeAgo(brand.updated_at)}</p>

      {menuOpen && onRequestDelete && (
        <>
          {/* Invisible backdrop closes the menu on an outside click/tap. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
            }}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-4 top-14 z-20 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
                onRequestDelete(brand);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </>
      )}
    </Link>
  );
}
