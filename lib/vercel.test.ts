import { describe, it, expect } from "vitest";
import { dnsRecordName, dnsRecordsFor } from "./vercel";

describe("dnsRecordName", () => {
  it("裸域返回 @", () => {
    expect(dnsRecordName("example.com", "example.com")).toBe("@");
  });
  it("子域返回前缀", () => {
    expect(dnsRecordName("www.example.com", "example.com")).toBe("www");
    expect(dnsRecordName("go.app.example.com", "example.com")).toBe("go.app");
  });
  it("大小写不敏感", () => {
    expect(dnsRecordName("WWW.Example.com", "example.com")).toBe("WWW");
  });
});

describe("dnsRecordsFor", () => {
  it("裸域给 A 记录 → 76.76.21.21", () => {
    expect(dnsRecordsFor("example.com", "example.com")).toEqual([
      { type: "A", name: "@", value: "76.76.21.21" },
    ]);
  });
  it("子域给 CNAME → cname.vercel-dns.com", () => {
    expect(dnsRecordsFor("www.example.com", "example.com")).toEqual([
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    ]);
  });
  it("附带 Vercel 归属校验 TXT 记录", () => {
    const records = dnsRecordsFor("example.com", "example.com", [
      { type: "TXT", domain: "_vercel.example.com", value: "vc-domain-verify=xyz" },
    ]);
    expect(records).toEqual([
      { type: "A", name: "@", value: "76.76.21.21" },
      { type: "TXT", name: "_vercel", value: "vc-domain-verify=xyz" },
    ]);
  });
});
