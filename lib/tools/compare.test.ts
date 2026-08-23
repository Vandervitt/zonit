import { describe, it, expect } from "vitest";
import { buildCompareTable, DIMENSIONS } from "./compare";
import { FINDING_DIMENSION, UNCOMPARABLE_FINDINGS } from "./report";
import { tools as enTools } from "@/lib/i18n/dictionaries/en/tools";
import type { StoredReport } from "./store";

// 这个文件存在的唯一理由：对比表是**按 finding id 工作的**，改 id 不会让任何
// 现有测试变红，只会让表格里某一列永远空白。下面第一条断言就是那道闸门。

function report(id: string, url: string, findings: StoredReport["findings"]): StoredReport {
  return {
    id,
    inputUrl: url,
    finalUrl: url,
    locale: "en",
    status: 200,
    bytes: 1000,
    hops: 1,
    findings,
    browserVerified: false,
    createdAt: "2026-08-19T00:00:00.000Z",
  };
}

describe("对比维度映射", () => {
  it("字典里每个 finding id 要么归入某个维度，要么在豁免名单里", () => {
    // 字典的 findings 键与 report.ts 产出的 id 一一对应（由 tools.test.ts 守护），
    // 所以拿它当「全部 id」的清单是可靠的，且不需要执行检查逻辑。
    const allIds = Object.keys(enTools.findings);
    const unclassified = allIds.filter(
      (id) => !(id in FINDING_DIMENSION) && !UNCOMPARABLE_FINDINGS.has(id),
    );
    expect(unclassified).toEqual([]);
  });

  it("映射表里的维度名都是真实存在的列", () => {
    const unknown = Object.values(FINDING_DIMENSION).filter(
      (d) => !(DIMENSIONS as readonly string[]).includes(d),
    );
    expect(unknown).toEqual([]);
  });

  it("字典里有每个维度的表头文案", () => {
    for (const dim of DIMENSIONS) {
      expect(enTools.compare.dimensions[dim]).toBeTruthy();
    }
  });
});

describe("buildCompareTable", () => {
  it("按维度归位，并按提交顺序保留行", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com/x", [{ id: "privacy_missing", level: "attention" }]),
      report("r2", "https://www.b.com/y", [{ id: "privacy_ok", level: "info", data: { href: "/p" } }]),
    ]);

    expect(table.rows.map((r) => r.reportId)).toEqual(["r1", "r2"]);
    expect(table.rows[0].cells.privacy.finding?.id).toBe("privacy_missing");
    expect(table.rows[1].cells.privacy.finding?.id).toBe("privacy_ok");
    // host 去掉 www，让表格窄一列。
    expect(table.rows[1].host).toBe("b.com");
  });

  it("attentionCount 只数 attention，不给页面打分", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com", [
        { id: "privacy_missing", level: "attention" },
        { id: "terms_missing", level: "attention" },
      ]),
      report("r2", "https://b.com", [{ id: "privacy_missing", level: "attention" }]),
      report("r3", "https://c.com", [{ id: "privacy_ok", level: "info" }]),
    ]);

    expect(table.attentionCount.privacy).toBe(2);
    expect(table.attentionCount.terms).toBe(1);
    expect(table.attentionCount.contact).toBe(0);
    // 行上没有分数字段——一旦有人加了，这条会提醒他先回去读设计红线。
    expect(table.rows[0]).not.toHaveProperty("score");
  });

  // 本地走查发现的真实缺陷：整列都是 unknown 时表头显示「无」，
  // 读者会读成「这项没问题」，而真相是静态检查看不出来。
  it("unknown 单独计数，不被并进「无」", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com", [{ id: "pixel_not_found_in_html", level: "unknown" }]),
      report("r2", "https://b.com", [{ id: "pixel_with_cmp", level: "unknown" }]),
    ]);
    expect(table.attentionCount.consent).toBe(0);
    expect(table.unknownCount.consent).toBe(2);
  });

  it("同维度多条命中时取更值得看的那条", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com", [
        { id: "viewport_ok", level: "info" },
        { id: "viewport_zoom_blocked", level: "attention" },
      ]),
    ]);
    expect(table.rows[0].cells.viewport.finding?.id).toBe("viewport_zoom_blocked");
  });

  it("整页抓取失败时不铺各维度格子——空白会被误读成没问题", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com", [
        { id: "fetch_failed", level: "attention", data: { reason: "timeout" } },
      ]),
    ]);
    expect(table.rows[0].blocked?.id).toBe("fetch_failed");
    expect(table.rows[0].cells.privacy.finding).toBeNull();
    // 没检查成的页不该给任何一列贡献计数。
    expect(table.attentionCount.privacy).toBe(0);
  });

  it("robots 拦截同样按整页失败处理", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com", [{ id: "robots_disallows_check", level: "attention" }]),
    ]);
    expect(table.rows[0].blocked?.id).toBe("robots_disallows_check");
  });
});

// 生产走查发现的真实缺陷（2026-08-23）：对比 go.foreverbooked.com/in-house 与
// /playbook，两行的标识都只有 host，**报告说「有一张页缺隐私政策」却没说是哪一张**。
// 而「同域多路径」正是代运营方最典型的形态（go.客户域.com/offer、/quote），
// 也就是说这个缺陷专门在我们最想服务的场景下发作。
// 更糟的是这样的链接已经发给过真实潜客——收信人无法核对信里说的是哪张页，
// 而「每句可核实」是这批信唯一的差异点。
describe("行标识必须能区分同域的不同页", () => {
  it("同域不同路径：标识带上路径", () => {
    const table = buildCompareTable([
      report("r1", "https://go.foreverbooked.com/in-house", [
        { id: "privacy_ok", level: "info", data: { href: "/p" } },
      ]),
      report("r2", "https://go.foreverbooked.com/playbook", [
        { id: "privacy_missing", level: "attention" },
      ]),
    ]);

    const labels = table.rows.map((r) => r.label);
    expect(labels).toEqual([
      "go.foreverbooked.com/in-house",
      "go.foreverbooked.com/playbook",
    ]);
    // 真正的判据不是格式而是「两行不一样」——格式可以再改，这条不能破。
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("根路径不画蛇添足地拖一个斜杠", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com", []),
      report("r2", "https://www.b.com/", []),
    ]);
    expect(table.rows.map((r) => r.label)).toEqual(["a.com", "b.com"]);
  });

  it("路径相同只有 query 不同时，靠 query 区分", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com/offer?v=a", []),
      report("r2", "https://a.com/offer?v=b", []),
    ]);
    expect(table.rows.map((r) => r.label)).toEqual(["a.com/offer?v=a", "a.com/offer?v=b"]);
  });

  it("根路径带 query 时保留斜杠——a.com?x=1 读起来像拼错了", () => {
    const table = buildCompareTable([
      report("r1", "https://a.com/?v=a", []),
      report("r2", "https://a.com?v=b", []),
    ]);
    expect(table.rows.map((r) => r.label)).toEqual(["a.com/?v=a", "a.com/?v=b"]);
  });

  it("剥掉 www 后撞车时退回完整 URL，绝不留两行同名", () => {
    // hostOf 去 www 是为了窄一列，但 a.com 与 www.a.com 是两个真实不同的落点，
    // 折叠后就分不出来了——这时候窄一列的收益必须让位于可区分。
    const table = buildCompareTable([
      report("r1", "https://a.com", []),
      report("r2", "https://www.a.com", []),
    ]);
    const labels = table.rows.map((r) => r.label);
    expect(new Set(labels).size).toBe(2);
    expect(labels).toEqual(["https://a.com", "https://www.a.com"]);
  });

  it("host 仍然单独保留，供需要窄标识的地方使用", () => {
    const table = buildCompareTable([report("r1", "https://www.b.com/y", [])]);
    expect(table.rows[0].host).toBe("b.com");
  });
});
