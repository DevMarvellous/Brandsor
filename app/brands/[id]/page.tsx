"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Save,
  History,
  Globe,
  Lock,
  ExternalLink,
  ArrowLeft,
  Download,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ConfirmModal from "@/components/ConfirmModal";
import { getAccessToken } from "@/lib/supabase/client";
import {
  emptyBrandState,
  normalizeBrandState,
  type BrandState,
  type PaletteColor,
  type Typography,
} from "@/lib/brands";
import PalettePicker from "@/components/workspace/PalettePicker";
import TypographyPicker from "@/components/workspace/TypographyPicker";
import GuidelinesEditor from "@/components/workspace/GuidelinesEditor";
import LogoUploader from "@/components/workspace/LogoUploader";
import UnsavedChangesModal from "@/components/workspace/UnsavedChangesModal";
import AiAssistButton from "@/components/workspace/AiAssistButton";

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const brandId = params.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // The last slug the server confirmed — lets us skip a pointless save (and its
  // false "couldn't update" error) when the field is blurred without a change.
  const [savedSlug, setSavedSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [state, setState] = useState<BrandState>(emptyBrandState());
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [versionCount, setVersionCount] = useState(0);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);
  // Which guarded action is awaiting confirmation (go-public / change-link / delete).
  const [confirm, setConfirm] = useState<null | "public" | "slug" | "delete">(null);
  const [deleting, setDeleting] = useState(false);

  // ---- load -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        router.replace("/auth");
        return;
      }
      const res = await fetch(`/api/brands/${brandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cancelled) return;
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { brand, logoUrl, versionCount } = await res.json();
      setName(brand.name);
      setSlug(brand.slug);
      setSavedSlug(brand.slug);
      setIsPublic(brand.is_public);
      setState(normalizeBrandState(brand.state));
      setLogoUrl(logoUrl);
      setVersionCount(versionCount ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId, router]);

  // Warn before losing unsaved edits on tab close / refresh / external nav.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const leaveToDashboard = () => {
    if (dirty) {
      setShowLeaveModal(true);
      return;
    }
    router.push("/dashboard");
  };

  const handleSaveAndLeave = async () => {
    setSaving(true);
    setStatus("");
    const result = await persist({ name, state });
    setSaving(false);
    setShowLeaveModal(false);
    if (result?.ok) {
      setDirty(false);
      router.push("/dashboard");
    } else {
      setStatus(result?.data?.error?.message || "Save failed");
    }
  };

  const handleDiscardAndLeave = () => {
    setShowLeaveModal(false);
    router.push("/dashboard");
  };

  // ---- helpers ----------------------------------------------------------
  const patchState = (patch: Partial<BrandState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  // The logo route already persisted state.logoAssetId server-side; sync it into
  // local state (without marking dirty) so a later Save doesn't clobber it.
  const handleLogoUploaded = (url: string, assetId: string) => {
    setLogoUrl(url);
    setState((prev) => ({ ...prev, logoAssetId: assetId }));
  };

  const persist = useCallback(
    async (body: Record<string, unknown>) => {
      const token = await getAccessToken();
      if (!token) {
        router.replace("/auth");
        return null;
      }
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    },
    [brandId, router]
  );

  const save = async () => {
    setSaving(true);
    setStatus("");
    const result = await persist({ name, state });
    setSaving(false);
    if (result?.ok) {
      setDirty(false);
      setStatus("Saved");
    } else {
      setStatus(result?.data?.error?.message || "Save failed");
    }
  };

  const saveVersion = async () => {
    setSaving(true);
    setStatus("");
    // Persist current edits first so the snapshot captures exactly what's on screen.
    const saved = await persist({ name, state });
    if (!saved?.ok) {
      setSaving(false);
      setStatus(saved?.data?.error?.message || "Save failed");
      return;
    }
    setDirty(false);

    const token = await getAccessToken();
    const res = await fetch(`/api/brands/${brandId}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    setSaving(false);
    if (res.ok) {
      setVersionCount((n) => n + 1);
      setStatus("Snapshot saved ✓");
    } else {
      setStatus("Could not save snapshot");
    }
  };

  const applyPublic = async (next: boolean) => {
    const result = await persist({ is_public: next });
    if (result?.ok) {
      setIsPublic(next);
      setStatus(next ? "Brand is now public" : "Brand is now private");
    } else {
      setStatus(result?.data?.error?.message || "Could not update visibility");
    }
  };

  // Going public exposes the brand → confirm. Making private is harmless → immediate.
  const requestTogglePublic = () => {
    if (!isPublic) setConfirm("public");
    else applyPublic(false);
  };

  // Changing the slug breaks the old link → confirm before applying.
  const requestSaveSlug = () => {
    if (slug.trim() === savedSlug) return;
    setConfirm("slug");
  };

  const deleteBrand = async () => {
    setDeleting(true);
    const token = await getAccessToken();
    if (!token) {
      router.replace("/auth");
      return;
    }
    const res = await fetch(`/api/brands/${brandId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
      setConfirm(null);
      setStatus("Could not delete workspace");
    }
  };

  const saveSlug = async () => {
    // No change → don't fire a save (avoids a spurious "couldn't update" on blur).
    if (slug.trim() === savedSlug) return;
    const result = await persist({ slug });
    if (result?.ok) {
      setSlug(result.data.brand.slug);
      setSavedSlug(result.data.brand.slug);
      setStatus("URL updated");
    } else {
      setStatus(result?.data?.error?.message || "Could not update URL");
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const payload = { name, slug, ...state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, `${slug || "brand"}.json`);
  };

  const downloadCard = async () => {
    setDownloadingCard(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/brands/${brandId}/card`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setStatus("Could not generate card image");
        return;
      }
      triggerDownload(await res.blob(), `${slug || "brand"}-card.png`);
    } finally {
      setDownloadingCard(false);
    }
  };

  // ---- render -----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
        <Navbar />
        <div className="max-w-md mx-auto text-center py-32 px-4">
          <h1 className="text-2xl font-bold mb-2">Brand not found</h1>
          <p className="text-gray-500 mb-6">It may have been deleted, or it isn&apos;t yours.</p>
          <Link href="/dashboard" className="text-primary font-medium hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 pb-24">
        <button
          type="button"
          onClick={leaveToDashboard}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>

        {/* Logo + name */}
        <section className="mb-10">
          <LogoUploader brandId={brandId} logoUrl={logoUrl} onUploaded={handleLogoUploaded} />
          <input
            value={name}
            aria-label="Brand name"
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="mt-5 w-full text-3xl font-bold bg-transparent border-b border-transparent focus:border-gray-300 dark:focus:border-gray-700 focus:outline-none pb-1"
            placeholder="Brand name"
          />
          <div className="mt-4 space-y-2">
            {state.taglines.map((tagline, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={tagline}
                  onChange={(e) => {
                    const newTaglines = [...state.taglines];
                    newTaglines[idx] = e.target.value;
                    patchState({ taglines: newTaglines });
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#0f0f0f] rounded-lg focus:outline-none focus:ring-2 ring-primary"
                  placeholder="Brand tagline or motto"
                />
                <button
                  onClick={() => {
                    patchState({ taglines: state.taglines.filter((_, i) => i !== idx) });
                  }}
                  className="px-2 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Remove tagline"
                >
                  ✕
                </button>
              </div>
            ))}
            {state.taglines.length < 10 && (
              <button
                onClick={() => patchState({ taglines: [...state.taglines, ""] })}
                className="text-sm px-3 py-2 text-primary hover:bg-primary/5 rounded-lg"
              >
                + Add tagline
              </button>
            )}
            <AiAssistButton
              brandId={brandId}
              field="taglines"
              onAdd={(s) => patchState({ taglines: [...state.taglines, s as string] })}
            />
          </div>
        </section>

        {/* Other name ideas — brainstorming list, never overwrites the real name above */}
        <Section title="Other name ideas">
          <div className="space-y-2">
            {state.altNames.map((altName, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={altName}
                  onChange={(e) => {
                    const next = [...state.altNames];
                    next[idx] = e.target.value;
                    patchState({ altNames: next });
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#0f0f0f] rounded-lg focus:outline-none focus:ring-2 ring-primary"
                  placeholder="Another name you're considering"
                />
                <button
                  onClick={() => {
                    patchState({ altNames: state.altNames.filter((_, i) => i !== idx) });
                  }}
                  className="px-2 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            {state.altNames.length < 5 && (
              <button
                onClick={() => patchState({ altNames: [...state.altNames, ""] })}
                className="text-sm px-3 py-2 text-primary hover:bg-primary/5 rounded-lg"
              >
                + Add a name idea
              </button>
            )}
            <AiAssistButton
              brandId={brandId}
              field="altNames"
              onAdd={(s) => patchState({ altNames: [...state.altNames, s as string] })}
            />
          </div>
        </Section>

        {/* Palette */}
        <Section title="Palette">
          <PalettePicker
            palette={state.palette}
            onChange={(palette: PaletteColor[]) => patchState({ palette })}
          />
          <AiAssistButton
            brandId={brandId}
            field="palette"
            onAdd={(s) => patchState({ palette: [...state.palette, s as PaletteColor] })}
          />
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <TypographyPicker
            typography={state.typography}
            onChange={(typography: Typography | null) => patchState({ typography })}
            recommendedId={state.recommendedTypographyId}
          />
        </Section>

        {/* Guidelines */}
        <Section title="Brand guidelines">
          <GuidelinesEditor
            value={state.guidelines}
            onChange={(guidelines) => patchState({ guidelines })}
          />
        </Section>

        {/* Public URL */}
        <Section title="Public profile">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {isPublic ? (
                <Globe className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <span className="text-gray-500">
                {isPublic ? "Anyone with the link can view" : "Only you can view"}
              </span>
            </div>
            <button
              type="button"
              onClick={requestTogglePublic}
              className={`self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-medium border active:scale-95 transition-all ${
                isPublic
                  ? "border-gray-300 dark:border-gray-700 hover:border-primary"
                  : "bg-primary text-black border-primary"
              }`}
            >
              {isPublic ? "Make private" : "Make public"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 whitespace-nowrap">/b/</span>
            <input
              value={slug}
              aria-label="Public profile URL slug"
              onChange={(e) => setSlug(e.target.value)}
              onBlur={requestSaveSlug}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
            />
            {isPublic && (
              <Link
                href={`/b/${slug}`}
                target="_blank"
                className="p-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:text-primary"
                title="Open public profile"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        </Section>

        {/* Export */}
        <Section title="Export">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadCard}
              disabled={downloadingCard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-700 hover:border-primary disabled:opacity-60"
            >
              {downloadingCard ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download card (PNG)
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-700 hover:border-primary"
            >
              <Download className="w-4 h-4" />
              Download data (JSON)
            </button>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/40 p-4">
            <div className="text-sm min-w-0">
              <p className="font-medium text-red-600 dark:text-red-400">Delete this workspace</p>
              <p className="text-gray-500 dark:text-gray-400">
                Permanently removes the brand, its snapshots, and assets. This can&apos;t be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirm("delete")}
              className="self-start shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete workspace
            </button>
          </div>
        </Section>
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-gray-300 dark:border-gray-800 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3">
          <span className="text-sm text-gray-400 min-w-0 truncate">
            {status ||
              (dirty
                ? "Unsaved changes"
                : versionCount > 0
                ? `${versionCount} snapshot${versionCount === 1 ? "" : "s"} saved`
                : "")}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:border-primary disabled:opacity-60 ${
                status === "Saved" ? "animate-pulse-once" : ""
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              type="button"
              onClick={saveVersion}
              disabled={saving}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap ${
                status === "Snapshot saved ✓" ? "animate-pulse-once" : ""
              }`}
            >
              <History className="w-4 h-4" /> <span className="hidden sm:inline">Save </span>Snapshot
            </button>
          </div>
        </div>
      </div>

      {showLeaveModal && (
        <UnsavedChangesModal
          saving={saving}
          onSave={handleSaveAndLeave}
          onDiscard={handleDiscardAndLeave}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}

      {confirm === "public" && (
        <ConfirmModal
          title="Make this brand public?"
          message="Anyone with the link will be able to view this brand's profile."
          confirmLabel="Make public"
          onConfirm={() => {
            setConfirm(null);
            applyPublic(true);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm === "slug" && (
        <ConfirmModal
          title="Change your public link?"
          message={`Your current link (/b/${savedSlug}) will stop working — it won't redirect to the new one.`}
          confirmLabel="Change link"
          onConfirm={() => {
            setConfirm(null);
            saveSlug();
          }}
          onCancel={() => {
            setConfirm(null);
            setSlug(savedSlug);
          }}
        />
      )}

      {confirm === "delete" && (
        <ConfirmModal
          title="Delete this workspace?"
          message="This permanently removes the brand, its snapshots, and uploaded assets."
          confirmLabel="Delete"
          danger
          loading={deleting}
          secondStep={{
            title: "Are you sure?",
            message: "This can't be undone.",
            confirmLabel: "Yes, delete",
          }}
          onConfirm={deleteBrand}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}
