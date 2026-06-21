"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { supabase, getAccessToken, getUserId } from "@/lib/supabase/client";
import {
  BRAND_ASSETS_BUCKET,
  ALLOWED_LOGO_MIME,
  MAX_LOGO_BYTES,
  brandLogoPath,
} from "@/lib/storage";

interface Props {
  brandId: string;
  logoUrl: string | null;
  onUploaded: (logoUrl: string, assetId: string) => void;
}

export default function LogoUploader({ brandId, logoUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    if (!ALLOWED_LOGO_MIME.includes(file.type as (typeof ALLOWED_LOGO_MIME)[number])) {
      setError("Use a PNG, JPEG, SVG, or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Image is too large (max 2MB).");
      return;
    }

    setBusy(true);
    try {
      const uid = await getUserId();
      const token = await getAccessToken();
      if (!uid || !token) {
        setError("Please sign in again.");
        return;
      }

      // Upload the binary straight to Storage (owner-only write enforced by RLS on
      // the {uid}/... path prefix) — keeps file bytes off our serverless functions.
      const path = brandLogoPath(uid, brandId, file.type);
      const { error: upErr } = await supabase.storage
        .from(BRAND_ASSETS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError("Upload failed. Is the brand-assets bucket set up?");
        return;
      }

      // Register the asset + point the brand at it (server-side, authorized).
      const res = await fetch(`/api/brands/${brandId}/logo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storagePath: path,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Could not save logo.");
        return;
      }
      onUploaded(data.logoUrl, data.assetId);
    } catch {
      setError("Something went wrong uploading the logo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#151515] flex items-center justify-center overflow-hidden">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Brand logo" className="w-full h-full object-contain" />
        ) : (
          <ImageIcon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_LOGO_MIME.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {logoUrl ? "Replace logo" : "Upload logo"}
        </button>
        <p className="text-xs text-gray-400 mt-1.5">PNG, JPEG, SVG, or WebP · max 2MB</p>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}
