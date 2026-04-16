import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows within limit then blocks", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(req, "t", 3, 60_000).allowed).toBe(true);
    }
    expect(checkRateLimit(req, "t", 3, 60_000).allowed).toBe(false);
  });
});
