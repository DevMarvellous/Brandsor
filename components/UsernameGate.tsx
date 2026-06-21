"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { supabase, getAccessToken } from "@/lib/supabase/client";
import { isValidUsername, normalizeUsername } from "@/lib/usernames";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

/**
 * Blocks the rest of the app behind a full-screen username prompt until a
 * signed-in user has one set. Anonymous visitors are completely unaffected —
 * this only ever checks/renders when a session exists.
 */
export default function UsernameGate() {
  const [needsUsername, setNeedsUsername] = useState(false);
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState("");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) {
        setChecked(true);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .maybeSingle();
      setNeedsUsername(!profile?.username);
      setChecked(true);
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const candidate = normalizeUsername(value);
    if (!candidate) {
      setAvailability("idle");
      return;
    }
    if (!isValidUsername(candidate)) {
      setAvailability("invalid");
      return;
    }
    setAvailability("checking");
    debounceRef.current = setTimeout(async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const res = await fetch(
          `/api/profile/username?u=${encodeURIComponent(candidate)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setAvailability(data.available ? "available" : "taken");
      } catch {
        setAvailability("idle");
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availability !== "available" || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/profile/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: normalizeUsername(value) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Could not set username.");
        return;
      }
      setNeedsUsername(false);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!checked || !needsUsername) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-gray-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-1">Choose a username</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This is how you'll show up in Brandsor. You can change it later, up to
          once a week.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              placeholder="yourname"
              aria-label="Username"
              className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:ring-2 ring-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {availability === "checking" && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
              {availability === "available" && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {(availability === "taken" || availability === "invalid") && (
                <X className="w-4 h-4 text-red-500" />
              )}
            </span>
          </div>
          <p className="text-xs mt-2 min-h-[1rem] text-gray-400">
            {availability === "invalid" &&
              "3-20 characters: lowercase letters, numbers, underscores."}
            {availability === "taken" && (
              <span className="text-red-500">That username is taken.</span>
            )}
            {availability === "available" && (
              <span className="text-green-500">Available</span>
            )}
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <button
            type="submit"
            disabled={availability !== "available" || submitting}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-black px-4 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-transform"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
