import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_CHANGE_COOLDOWN_DAYS,
} from "@/lib/usernames";

export const dynamic = "force-dynamic";

const BODY_MAX_BYTES = 256;
const COOLDOWN_MS = USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const INVALID_MSG =
  "Usernames must be 3-20 characters: lowercase letters, numbers, and underscores only.";

// `ilike` treats `%`/`_`/`\` as SQL wildcards — usernames allow underscores, so an
// unescaped lookup for "john_doe" would also match "johnxdoe". Escape for an exact
// case-insensitive match instead of a pattern match.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

// GET ?u=<candidate> — live availability check while typing.
export async function GET(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const candidate = normalizeUsername(searchParams.get("u") || "");

    if (!isValidUsername(candidate)) {
      return NextResponse.json({ available: false, reason: INVALID_MSG });
    }

    const { data: clash } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", escapeLike(candidate))
      .maybeSingle();

    const available = !clash || clash.id === uid;
    return NextResponse.json({
      available,
      reason: available ? undefined : "That username is taken.",
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}

// PATCH { username } — set (first time, no cooldown) or change (cooldown applies).
export async function PATCH(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const parsed = await parseJsonBody<{ username?: unknown }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const username =
      typeof parsed.data.username === "string"
        ? normalizeUsername(parsed.data.username)
        : "";
    if (!isValidUsername(username)) {
      return errorResponse("BAD_REQUEST", INVALID_MSG, 400);
    }

    const { data: profile, error: selErr } = await supabaseAdmin
      .from("profiles")
      .select("username, username_changed_at")
      .eq("id", uid)
      .maybeSingle();
    if (selErr) throw selErr;

    const isNoOpCasing =
      profile?.username && profile.username.toLowerCase() === username.toLowerCase();

    if (profile?.username && !isNoOpCasing && profile.username_changed_at) {
      const elapsed = Date.now() - new Date(profile.username_changed_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        const daysLeft = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
        return errorResponse(
          "RATE_LIMITED",
          `You can change your username again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
          429
        );
      }
    }

    if (!isNoOpCasing) {
      const { data: clash } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("username", escapeLike(username))
        .maybeSingle();
      if (clash && clash.id !== uid) {
        return errorResponse("BAD_REQUEST", "That username is taken.", 409);
      }
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ username, username_changed_at: new Date().toISOString() })
      .eq("id", uid)
      .select("username, username_changed_at")
      .single();
    if (updErr) throw updErr;

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Error setting username:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
