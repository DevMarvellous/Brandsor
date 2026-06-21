"use client";

import Link from "next/link";
import { Globe, Lock, ImageIcon } from "lucide-react";
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

export default function BrandCard({ brand }: { brand: BrandCardData }) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="group block bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md"
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
    </Link>
  );
}
