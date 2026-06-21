import { createClient } from "@supabase/supabase-js";

// Fallbacks keep `createClient` from throwing at build/boot when env is unset.
// Real API calls require real values (set these in the server environment).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

/**
 * Server-only Supabase instance using the service-role key. Bypasses RLS, so it
 * must never be imported into client code. Use only inside route handlers /
 * server components.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
