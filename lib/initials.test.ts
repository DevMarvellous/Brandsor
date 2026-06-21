import { describe, it, expect } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("uses first + last name initials", () => {
    expect(getInitials("Marvellous Adepoju")).toBe("MA");
    expect(getInitials("  Ada   Lovelace  ")).toBe("AL");
  });

  it("takes first two letters for a single-word name", () => {
    expect(getInitials("Madonna")).toBe("MA");
  });

  it("falls back to email when no name", () => {
    expect(getInitials(null, "founder@brandsor.xyz")).toBe("FO");
    expect(getInitials(undefined, "x@y.com")).toBe("X@");
  });

  it("falls back to ? when nothing is available", () => {
    expect(getInitials(null, null)).toBe("?");
    expect(getInitials("", "")).toBe("?");
  });
});
