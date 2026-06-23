import { describe, it, expect } from "vitest";
import { leadsToCsv, type LeadCsvRow } from "./csv";

const rows: LeadCsvRow[] = [
  { page_name: "页面A", name: "Tom", email: "t@x.com", phone: "", whatsapp: "", telegram: "", message: "hi, there", channel: "form", utm_source: "fb", created_at: "2026-06-23T00:00:00Z" },
];

describe("leadsToCsv", () => {
  it("含表头 + 行", () => {
    const csv = leadsToCsv(rows);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("page_name");
    expect(lines).toHaveLength(2);
  });
  it("含逗号的值被引号包裹", () => {
    expect(leadsToCsv(rows)).toContain('"hi, there"');
  });
  it("含双引号的值转义为两个双引号", () => {
    const csv = leadsToCsv([{ ...rows[0], message: 'say "hi"' }]);
    expect(csv).toContain('"say ""hi"""');
  });
  it("空集只有表头", () => {
    expect(leadsToCsv([]).trim().split("\n")).toHaveLength(1);
  });
});
