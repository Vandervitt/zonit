import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));

import { computeLeadNudges, markNudged, NUDGE_AFTER_HOURS, NUDGE_MAX_AGE_DAYS, MAX_LEADS_PER_EMAIL } from "./nudge";

const NOW = new Date("2026-07-31T00:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

const row = (over: Record<string, unknown> = {}) => ({
  id: "l1",
  user_id: "u1",
  email: "owner@example.com",
  page_name: "Solar Quotes",
  payload: { name: "Ann", whatsapp: "+15551234567" },
  created_at: hoursAgo(50),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue({ rows: [] });
});

describe("computeLeadNudges 查询口径", () => {
  it("只取「静置超 48h、未读、未提醒过、且不早于 30 天」的线索", async () => {
    await computeLeadNudges(NOW);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain("is_read = false");
    expect(sql).toContain("nudged_at IS NULL");
    // 上线首日不得把历史积压的未读线索一次性轰出去
    expect(params).toEqual([
      new Date(NOW.getTime() - NUDGE_AFTER_HOURS * 3_600_000),
      new Date(NOW.getTime() - NUDGE_MAX_AGE_DAYS * 86_400_000),
    ]);
  });

  it("按租户分组，同一租户的多条线索合并成一封", async () => {
    queryMock.mockResolvedValue({
      rows: [
        row({ id: "l1" }),
        row({ id: "l2", page_name: "Roof Repair" }),
        row({ id: "l3", user_id: "u2", email: "other@example.com" }),
      ],
    });
    const nudges = await computeLeadNudges(NOW);
    expect(nudges).toHaveLength(2);
    expect(nudges[0]).toMatchObject({ userId: "u1", email: "owner@example.com" });
    expect(nudges[0].leads.map((l) => l.id)).toEqual(["l1", "l2"]);
    expect(nudges[1].leads).toHaveLength(1);
  });

  it("带上等待时长与联系方式摘要，供邮件正文直接用", async () => {
    queryMock.mockResolvedValue({ rows: [row({ created_at: hoursAgo(72) })] });
    const [nudge] = await computeLeadNudges(NOW);
    expect(nudge.leads[0]).toMatchObject({
      pageName: "Solar Quotes",
      waitedHours: 72,
      contact: "Ann · +15551234567",
    });
  });

  it("邮件里最多列 MAX_LEADS_PER_EMAIL 条，但 totalCount 反映真实条数", async () => {
    const rows = Array.from({ length: MAX_LEADS_PER_EMAIL + 3 }, (_, i) => row({ id: `l${i}` }));
    queryMock.mockResolvedValue({ rows });
    const [nudge] = await computeLeadNudges(NOW);
    expect(nudge.leads).toHaveLength(MAX_LEADS_PER_EMAIL);
    expect(nudge.totalCount).toBe(MAX_LEADS_PER_EMAIL + 3);
  });

  it("所有待提醒线索的 id 都在 leadIds 里（含未列进邮件的），避免下轮重复提醒", async () => {
    const rows = Array.from({ length: MAX_LEADS_PER_EMAIL + 2 }, (_, i) => row({ id: `l${i}` }));
    queryMock.mockResolvedValue({ rows });
    const [nudge] = await computeLeadNudges(NOW);
    expect(nudge.leadIds).toHaveLength(MAX_LEADS_PER_EMAIL + 2);
  });
});

describe("markNudged", () => {
  it("空数组不打 DB", async () => {
    await markNudged([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("按 id 批量写入 nudged_at", async () => {
    await markNudged(["l1", "l2"]);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain("SET nudged_at = NOW()");
    expect(params).toEqual([["l1", "l2"]]);
  });
});
