import { createClient } from "@supabase/supabase-js";

// Fallbacks keep `createClient` from throwing at build/boot when env is unset
// (CI, preview, first local run). Real API calls require real values.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/** Browser/client Supabase instance (anon key, persists session in storage). */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Convenience: current session access token for authorizing API calls. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Convenience: current signed-in user id (needed for Storage upload paths). */
export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
