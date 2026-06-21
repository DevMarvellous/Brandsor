import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUid = vi.fn();
vi.mock("@/lib/apiAuth", () => ({
  getUidFromBearer: () => mockGetUid(),
}));

const mockStarter = vi.fn();
vi.mock("@/lib/gemini", () => ({
  generateBrandStarter: (...args: unknown[]) => mockStarter(...args),
  GeminiThrottledError: class GeminiThrottledError extends Error {},
}));

// Supabase mock: `.select().ilike()` resolves the slug lookup; `.insert().select().single()`
// resolves the insert.
const slugResult: { data: any; error: any } = { data: [], error: null };
const insertResult: { data: any; error: any } = { data: { id: "brand-1", slug: "acme" }, error: null };
const builder: any = {
  select: () => builder,
  ilike: () => Promise.resolve(slugResult),
  insert: () => builder,
  single: () => Promise.resolve(insertResult),
};
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: { from: () => builder },
}));

import { POST } from "./route";

function makeReq(body: unknown) {
  return new Request("http://localhost/api/brands/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/brands/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    slugResult.data = [];
    slugResult.error = null;
    insertResult.data = { id: "brand-1", slug: "acme" };
    insertResult.error = null;
  });

  it("returns 401 without a valid bearer", async () => {
    mockGetUid.mockResolvedValue(null);
    const res = await POST(makeReq({ name: "Acme" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockGetUid.mockResolvedValue("user-1");
    const res = await POST(makeReq({ tagline: "no name here" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("creates a brand and applies the AI starter when created via the AI-gen path (idea present)", async () => {
    mockGetUid.mockResolvedValue("user-1");
    mockStarter.mockResolvedValue({
      palette: [{ name: "Primary", hex: "#112233" }],
      taglines: ["Best widgets"],
      guidelineText: "Bold and friendly.",
    });

    const res = await POST(makeReq({ name: "Acme", idea: "A widget shop" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("brand-1");
    expect(body.slug).toBe("acme");
    expect(body.starterApplied).toBe(true);
    expect(mockStarter).toHaveBeenCalledOnce();
  });

  it("still creates the brand when the AI starter fails (degrades, no retry)", async () => {
    mockGetUid.mockResolvedValue("user-1");
    mockStarter.mockRejectedValue(new Error("throttled"));

    const res = await POST(makeReq({ name: "Acme", idea: "A widget shop" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.starterApplied).toBe(false);
    expect(mockStarter).toHaveBeenCalledOnce(); // exactly once — no retry
  });

  it("skips the AI starter entirely for manual creation (no idea) — fully empty workspace", async () => {
    mockGetUid.mockResolvedValue("user-1");

    const res = await POST(makeReq({ name: "Acme", tagline: "Best widgets" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.starterApplied).toBe(false);
    expect(mockStarter).not.toHaveBeenCalled();
  });
});
