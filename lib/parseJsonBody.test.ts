import { describe, it, expect } from "vitest";
import { parseJsonBody } from "./parseJsonBody";

describe("parseJsonBody", () => {
  it("parses valid JSON", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    const r = await parseJsonBody(req, 1000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ a: 1 });
  });

  it("rejects oversized body", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: "x".repeat(20),
    });
    const r = await parseJsonBody(req, 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect((await r.response.json()).error.code).toBe("BAD_REQUEST");
  });

  it("rejects invalid JSON", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: "{",
    });
    const r = await parseJsonBody(req, 100);
    expect(r.ok).toBe(false);
  });
});
