import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { buildUnsplashImageSources } from "@/lib/images/unsplash";

describe("buildUnsplashImageSources", () => {
  it("rewrites the width in a standard Unsplash URL", () => {
    const result = buildUnsplashImageSources(
      "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=1600&q=80",
    );

    expect(result.src).toBe("https://images.unsplash.com/photo-123?auto=format&fit=crop&w=800&q=80");
  });

  it("replaces a legacy jpg format with Unsplash automatic format negotiation", () => {
    const result = buildUnsplashImageSources(
      "https://images.unsplash.com/photo-123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    );

    expect(result.src).toContain("auto=format");
    expect(result.src).not.toContain("fm=jpg");
    expect(result.src).toContain("w=800");
  });

  it("generates responsive sources for 400, 800, and 1200 pixels", () => {
    const result = buildUnsplashImageSources("https://images.unsplash.com/photo-123");

    expect(result.srcSet).toBe(
      "https://images.unsplash.com/photo-123?auto=format&w=400&q=80 400w, " +
        "https://images.unsplash.com/photo-123?auto=format&w=800&q=80 800w, " +
        "https://images.unsplash.com/photo-123?auto=format&w=1200&q=80 1200w",
    );
  });

  it("returns an external non-Unsplash URL unchanged", () => {
    const url = "https://cdn.example.com/template.jpg";

    expect(buildUnsplashImageSources(url)).toEqual({ src: url });
  });

  it("adds Unsplash parameters when the URL has no query string", () => {
    const result = buildUnsplashImageSources("https://images.unsplash.com/photo-123");

    expect(result.src).toBe("https://images.unsplash.com/photo-123?auto=format&w=800&q=80");
  });

  it("produces valid responsive sources for every registered template thumbnail", () => {
    expect(TEMPLATES.length).toBeGreaterThan(0);

    for (const template of TEMPLATES) {
      const result = buildUnsplashImageSources(template.thumbnail);
      expect(result.src).toMatch(/^https:\/\/images\.unsplash\.com\/[^?]+\?/);
      expect(result.srcSet).toContain("400w");
      expect(result.srcSet).toContain("800w");
      expect(result.srcSet).toContain("1200w");
    }
  });
});
