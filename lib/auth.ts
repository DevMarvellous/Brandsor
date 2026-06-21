import { supabase } from "./supabase/client";

export const signInWithGoogle = async () => {
  // Supabase OAuth is a full-page redirect (not a popup). After Google auth the
  // browser returns to `redirectTo` with the session, which the client detects.
  const redirectTo = `${window.location.origin}/dashboard`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // Always show Google's account chooser instead of silently reusing the last
    // signed-in Google session — otherwise switching accounts requires hunting for
    // "use another account" inside Google's own UI.
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  if (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out", error);
  }
};
