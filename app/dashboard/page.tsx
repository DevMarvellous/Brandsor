"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GeneratorForm from "@/components/GeneratorForm";
import ResultCard from "@/components/ResultCard";
import BrandCard, { type BrandCardData } from "@/components/BrandCard";
import CreateWorkspaceChooser from "@/components/workspace/CreateWorkspaceChooser";
import QuickNameSave from "@/components/workspace/QuickNameSave";
import FullScreenLoader from "@/components/FullScreenLoader";
import ConfirmModal from "@/components/ConfirmModal";
import { getAccessToken } from "@/lib/supabase/client";
import {
  ANON_GENERATION_LIMIT,
  getAnonGenerationCount,
  incrementAnonGenerationCount,
} from "@/lib/anonLimits";
import Link from "next/link";

interface Result {
  name: string;
  tagline: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastIdea, setLastIdea] = useState("");
  const [lastTone, setLastTone] = useState("");
  const [brands, setBrands] = useState<BrandCardData[]>([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [anonLimitReached, setAnonLimitReached] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BrandCardData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load (or reload) the signed-in user's brands list.
  const fetchBrands = async () => {
    const token = await getAccessToken();
    setIsSignedIn(!!token);
    if (!token) return;
    try {
      const res = await fetch("/api/brands", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) setBrands(data.items);
    } catch {
      /* non-blocking */
    } finally {
      // Gates the "Create your first brand workspace" empty state — without
      // this, it briefly (or on a slow connection, not-so-briefly) shows for
      // every signed-in user with real brands too, since brands defaults to
      // [] until this fetch resolves.
      setBrandsLoaded(true);
    }
  };

  // Fetch on mount, then again whenever the user returns to this tab/page —
  // Next.js's client-side Router Cache can reuse this already-mounted page on
  // soft navigation (Link, back/forward), so a mount-only effect would miss
  // brands created elsewhere (e.g. just-created workspace -> back to dashboard).
  useEffect(() => {
    fetchBrands();
    const onFocus = () => fetchBrands();
    const onVisibility = () => {
      if (!document.hidden) fetchBrands();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Returns whether generation actually succeeded, so callers (like the
  // create-workspace modal) know whether to close themselves and reveal the
  // results grid underneath.
  const handleGenerate = async (
    idea: string,
    industry: string,
    tone: string
  ): Promise<boolean> => {
    setError("");
    setAnonLimitReached(false);

    // Generation itself is a free demo — no sign-in required, but anonymous use
    // is capped at ANON_GENERATION_LIMIT tries (client-side nudge, not a hard
    // quota) before we prompt sign-in. Signed-in users are never capped.
    const token = await getAccessToken();
    if (!token && getAnonGenerationCount() >= ANON_GENERATION_LIMIT) {
      setAnonLimitReached(true);
      return false;
    }

    setIsLoading(true);
    setResults([]);
    setVisibleCount(0);
    setLastIdea(idea);
    setLastTone(tone);

    try {
      if (token) {
        // Fire-and-forget usage tracking (non-blocking analytics only; skipped
        // for anonymous demo use since there's no account to attribute it to).
        fetch("/api/track-generation", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, industry, tone }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          (data?.error && typeof data.error === "object" && data.error.message) ||
          (typeof data?.error === "string" ? data.error : null) ||
          "Failed to generate names";
        throw new Error(msg);
      }

      if (data.items && Array.isArray(data.items)) {
        setResults(data.items);
        setVisibleCount(10);
        if (!token) incrementAnonGenerationCount();
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Wrappers used only by the create-workspace modal, so it can close itself
  // once the underlying action actually succeeds (manual create redirects
  // away immediately; AI generation reveals the existing results grid below
  // where the modal was).
  const handleGenerateFromModal = async (idea: string, industry: string, tone: string) => {
    const ok = await handleGenerate(idea, industry, tone);
    if (ok) setShowCreateModal(false);
  };

  const handleCreateBrandFromModal = async (name: string, tagline: string) => {
    setShowCreateModal(false);
    await handleCreateBrand(name, tagline);
  };

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, results.length));
  };

  const handleCreateBrand = async (name: string, tagline: string) => {
    setError("");
    setCreatingBrand(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Please sign in to create a brand");
        return;
      }

      const res = await fetch("/api/brands/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, tagline, idea: lastIdea, tone: lastTone }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          (data?.error && typeof data.error === "object" && data.error.message) ||
          "Failed to create brand";
        throw new Error(msg);
      }

      router.push(`/brands/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setCreatingBrand(false);
    }
  };

  const confirmDeleteBrand = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/brands/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteTarget(null);
        await fetchBrands();
      } else {
        setError("Could not delete that workspace.");
      }
    } catch {
      setError("Could not delete that workspace.");
    } finally {
      setDeleting(false);
    }
  };


  // While checking sign-in status, show a skeleton instead of a blank flash.
  if (isSignedIn === null) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
        <Navbar />
        <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse"
              />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // SIGNED-IN VIEW: Workspaces Hub
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
        <Navbar />
        <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">
          {/* "Continue where you left off" highlight for 3+ workspaces */}
          {brands.length >= 3 && (
            <section className="mt-8 mb-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Continue where you left off
              </p>
              <BrandCard brand={brands[0]!} onRequestDelete={setDeleteTarget} />
            </section>
          )}

          {/* All Workspaces, Empty State, or (while the fetch is still in
              flight) a loading skeleton — brands defaults to [] until the
              fetch resolves, so without brandsLoaded this would show the
              "Create your first brand workspace" empty state for everyone
              for a moment, even users with real workspaces. */}
          {!brandsLoaded ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse"
                />
              ))}
            </div>
          ) : brands.length > 0 ? (
            <section className={brands.length >= 3 ? "" : "mt-8"}>
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Your Workspaces</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {brands.map((b, i) => (
                  <div
                    key={b.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <BrandCard brand={b} onRequestDelete={setDeleteTarget} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Create your first brand workspace
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Build a complete brand identity with logo, palette, typography, and guidelines.
                Then share it with the world.
              </p>
            </section>
          )}

          {/* Primary "Create Workspace" action + the de-emphasized quick-save
              alternative next to it. The chooser itself now only appears
              inside the modal below, opened by the primary button. */}
          <div className={`flex flex-wrap items-center gap-3 ${brands.length > 0 ? "mt-12" : "mt-8"}`}>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Create Workspace
            </button>
            <QuickNameSave onSaved={fetchBrands} />
          </div>

          {/* Create Workspace modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-gray-700 p-6 shadow-2xl relative">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-6">Create Workspace</h2>
                <CreateWorkspaceChooser
                  onCreateBrand={handleCreateBrandFromModal}
                  onGenerate={handleGenerateFromModal}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-sm z-50 flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 dark:bg-[#1a1a1a] dark:text-red-400 dark:border-red-900/50 shadow-lg animate-fade-in-up">
              <span className="flex-1 text-sm">{error}</span>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss"
                className="shrink-0 hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Results Grid (from AI generation in the chooser) */}
          {results.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Generated Names</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {results.slice(0, visibleCount).map((res, index) => (
                  <div
                    key={index}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <ResultCard
                      name={res.name}
                      tagline={res.tagline}
                      onCreateBrand={handleCreateBrand}
                    />
                  </div>
                ))}
              </div>

              {visibleCount < results.length && (
                <div className="flex justify-center mt-8 sm:mt-12">
                  <button
                    onClick={showMore}
                    className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-800 px-6 sm:px-8 py-3 rounded-full font-medium hover:border-primary transition-colors hover:text-primary"
                  >
                    Show 5 more
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
        {creatingBrand && <FullScreenLoader message="Creating your workspace…" />}
        {deleteTarget && (
          <ConfirmModal
            title={`Delete "${deleteTarget.name}"?`}
            message="This permanently removes the brand, its snapshots, and uploaded assets."
            confirmLabel="Delete"
            danger
            loading={deleting}
            secondStep={{
              title: "Are you sure?",
              message: "This can't be undone.",
              confirmLabel: "Yes, delete",
            }}
            onConfirm={confirmDeleteBrand}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    );
  }

  // ANONYMOUS VIEW: Demo with 2-try limit
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">
        {/* Header */}
        <div className="text-center my-8 sm:my-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Try Brand Generation
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Describe your idea and get 20 brand names instantly.
          </p>
        </div>

        {/* Generator Form (limited to 2 tries) */}
        <div className="max-w-2xl mx-auto w-full mb-8">
          <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        {/* Anonymous demo limit reached */}
        {anonLimitReached && (
          <div className="max-w-2xl mx-auto w-full mb-8 p-6 bg-primary/5 border border-primary/30 rounded-2xl text-center animate-fade-in-up">
            <p className="font-medium mb-3">
              You've used your {ANON_GENERATION_LIMIT} free generations. Sign in to keep going —
              it's free.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-sm z-50 flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 dark:bg-[#1a1a1a] dark:text-red-400 dark:border-red-900/50 shadow-lg animate-fade-in-up">
            <span className="flex-1 text-sm">{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss"
              className="shrink-0 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Generated Names</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {results.slice(0, visibleCount).map((res, index) => (
                <div
                  key={index}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <ResultCard
                    name={res.name}
                    tagline={res.tagline}
                    onCreateBrand={handleCreateBrand}
                  />
                </div>
              ))}
            </div>

            {visibleCount < results.length && (
              <div className="flex justify-center mt-8 sm:mt-12">
                <button
                  onClick={showMore}
                  className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-800 px-6 sm:px-8 py-3 rounded-full font-medium hover:border-primary transition-colors hover:text-primary"
                >
                  Show 5 more
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
