import { describe, it, expect } from "vitest";
import {
  normalizeBrandState,
  emptyBrandState,
  slugify,
  isValidSlug,
  isReservedSlug,
  buildUniqueSlug,
} from "./brands";

describe("normalizeBrandState", () => {
  it("returns an empty state floor for junk input", () => {
    expect(normalizeBrandState(null)).toEqual(emptyBrandState());
    expect(normalizeBrandState("nope")).toEqual(emptyBrandState());
    expect(normalizeBrandState(42)).toEqual(emptyBrandState());
  });

  it("keeps and normalizes valid palette colors, drops bad ones", () => {
    const state = normalizeBrandState({
      palette: [
        { hex: "#FFAA00", name: "  Primary  " },
        { hex: "abc" }, // shorthand, no leading #
        { hex: "not-a-color" }, // dropped
        { foo: "bar" }, // dropped
      ],
    });
    expect(state.palette).toEqual([
      { hex: "#ffaa00", name: "Primary" },
      { hex: "#aabbcc" },
    ]);
  });

  it("caps palette length", () => {
    const many = Array.from({ length: 30 }, () => ({ hex: "#111111" }));
    expect(normalizeBrandState({ palette: many }).palette).toHaveLength(12);
  });

  it("returns null typography when both fonts are empty", () => {
    expect(normalizeBrandState({ typography: { headingFont: "", bodyFont: "" } }).typography).toBeNull();
    expect(normalizeBrandState({ typography: "Inter" }).typography).toBeNull();
  });

  it("keeps typography when at least one font is present", () => {
    expect(
      normalizeBrandState({ typography: { headingFont: "Poppins", bodyFont: "Inter" } }).typography
    ).toEqual({ headingFont: "Poppins", bodyFont: "Inter" });
  });

  it("passes object guidelines through but rejects primitives", () => {
    const doc = { type: "doc", content: [] };
    expect(normalizeBrandState({ guidelines: doc }).guidelines).toEqual(doc);
    expect(normalizeBrandState({ guidelines: "hello" }).guidelines).toBeNull();
  });

  it("normalizes taglines array, keeps logoAssetId only when a string", () => {
    const state = normalizeBrandState({
      taglines: ["  Big idea  ", "Second tagline"],
      logoAssetId: "asset-123",
    });
    expect(state.taglines).toEqual(["Big idea", "Second tagline"]);
    expect(state.logoAssetId).toBe("asset-123");
    expect(normalizeBrandState({ logoAssetId: 5 }).logoAssetId).toBeNull();
  });

  it("normalizes altNames array and caps it at 5", () => {
    const state = normalizeBrandState({
      altNames: ["  Idea One  ", "Idea Two", "", 42, "Idea Three", "Idea Four", "Idea Five", "Idea Six"],
    });
    expect(state.altNames).toEqual(["Idea One", "Idea Two", "Idea Three", "Idea Four", "Idea Five"]);
  });
});

describe("slugify", () => {
  it("lowercases, hyphenates, and strips edges", () => {
    expect(slugify("My Cool Brand!")).toBe("my-cool-brand");
    expect(slugify("  --Hello-- World  ")).toBe("hello-world");
    expect(slugify("***")).toBe("");
  });
});

describe("isValidSlug / isReservedSlug", () => {
  it("accepts well-formed non-reserved slugs", () => {
    expect(isValidSlug("my-brand")).toBe(true);
    expect(isValidSlug("brand2")).toBe(true);
  });

  it("rejects malformed slugs", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("-leading")).toBe(false);
    expect(isValidSlug("trailing-")).toBe(false);
    expect(isValidSlug("Has Space")).toBe(false);
    expect(isValidSlug("UPPER")).toBe(false);
  });

  it("rejects reserved slugs", () => {
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("b")).toBe(true);
    expect(isValidSlug("api")).toBe(false);
  });
});

describe("buildUniqueSlug", () => {
  it("returns the base slug when free", () => {
    expect(buildUniqueSlug("My Brand", new Set())).toBe("my-brand");
  });

  it("appends a numeric suffix on collision", () => {
    const taken = new Set(["my-brand", "my-brand-2"]);
    expect(buildUniqueSlug("My Brand", taken)).toBe("my-brand-3");
  });

  it("falls back to 'brand' when the name slugifies to nothing", () => {
    expect(buildUniqueSlug("***", new Set())).toBe("brand");
    expect(buildUniqueSlug("***", new Set(["brand"]))).toBe("brand-2");
  });

  it("avoids reserved words by suffixing", () => {
    const slug = buildUniqueSlug("dashboard", new Set());
    expect(slug).not.toBe("dashboard");
    expect(isValidSlug(slug)).toBe(true);
  });
});
