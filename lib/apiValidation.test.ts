import { describe, it, expect } from "vitest";
import {
  requiredString,
  normalizeOptionalString,
  isValidEmail,
} from "./apiValidation";

describe("apiValidation", () => {
  it("requiredString rejects empty and too long", () => {
    expect(requiredString("", 10)).toBeNull();
    expect(requiredString("   ", 10)).toBeNull();
    expect(requiredString("x".repeat(11), 10)).toBeNull();
    expect(requiredString("  hello  ", 10)).toBe("hello");
  });

  it("normalizeOptionalString trims and caps", () => {
    expect(normalizeOptionalString("  ab  ", 1)).toBe("a");
    expect(normalizeOptionalString(1 as unknown as string, 5)).toBe("");
  });

  it("isValidEmail basic pattern", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});
