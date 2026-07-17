import { describe, it, expect } from "vitest";
import { normalizeDomain } from "./domain";

describe("normalizeDomain", () => {
  it("accepts a bare hostname", () => {
    expect(normalizeDomain("zapbridge.tech")).toBe("zapbridge.tech");
  });

  it("strips the scheme from a pasted URL", () => {
    expect(normalizeDomain("https://zapbridge.tech")).toBe("zapbridge.tech");
    expect(normalizeDomain("http://zapbridge.tech")).toBe("zapbridge.tech");
  });

  it("strips path, query, trailing slash and port", () => {
    expect(normalizeDomain("https://zapbridge.tech/admin/domains")).toBe("zapbridge.tech");
    expect(normalizeDomain("zapbridge.tech/?ref=1")).toBe("zapbridge.tech");
    expect(normalizeDomain("zapbridge.tech:443")).toBe("zapbridge.tech");
  });

  it("trims whitespace, lowercases and drops a trailing dot", () => {
    expect(normalizeDomain("  WWW.Example.COM.  ")).toBe("www.example.com");
  });

  it("preserves subdomains", () => {
    expect(normalizeDomain("https://www.example.com")).toBe("www.example.com");
  });

  it("returns null for invalid input", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("https://")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
  });
});
