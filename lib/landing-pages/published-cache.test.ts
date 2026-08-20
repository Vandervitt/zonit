import { describe, expect, it, vi, beforeEach } from "vitest";

// unstable_cache 在测试环境没有 Next 的缓存上下文，这里直接透传，
// 让测试聚焦于「读走没走缓存层、失效有没有按正确的 tag 与档位发出」。
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

const getPublishedBySlug = vi.fn();
vi.mock("./store", () => ({
  getPublishedBySlug: (...a: unknown[]) => getPublishedBySlug(...a),
}));

const getUserPlan = vi.fn();
vi.mock("@/lib/plans-db", () => ({
  getUserPlan: (...a: unknown[]) => getUserPlan(...a),
}));

const {
  getPublishedBySlugCached,
  getUserPlanCached,
  invalidatePublishedPage,
  invalidateAllPublishedPages,
  invalidateUserPlan,
} = await import("./published-cache");

beforeEach(() => {
  revalidateTag.mockClear();
  getPublishedBySlug.mockReset();
  getUserPlan.mockReset();
});

describe("读路径", () => {
  it("按 slug 读时透传到 store", async () => {
    getPublishedBySlug.mockResolvedValue({ id: "p1", slug: "acme" });
    await expect(getPublishedBySlugCached("acme")).resolves.toMatchObject({ id: "p1" });
    expect(getPublishedBySlug).toHaveBeenCalledWith("acme");
  });

  it("套餐读时透传到 plans-db", async () => {
    getUserPlan.mockResolvedValue("pro");
    await expect(getUserPlanCached("u1")).resolves.toBe("pro");
    expect(getUserPlan).toHaveBeenCalledWith("u1");
  });
});

describe("失效", () => {
  it("按 slug 失效走该 slug 自己的 tag", () => {
    invalidatePublishedPage("acme");
    expect(revalidateTag).toHaveBeenCalledWith("published-page:acme", expect.anything());
  });

  // slug 可能为 null（数据库列可空）。静默跳过会让下线操作看似成功却没生效，
  // 故退化为全量失效——宁可多失效，不可漏失效。
  it("slug 为空时退化为全量失效，而不是静默跳过", () => {
    invalidatePublishedPage(null);
    expect(revalidateTag).toHaveBeenCalledWith("published-pages", expect.anything());
    revalidateTag.mockClear();
    invalidatePublishedPage(undefined);
    expect(revalidateTag).toHaveBeenCalledWith("published-pages", expect.anything());
  });

  it("全量失效走共享 tag", () => {
    invalidateAllPublishedPages();
    expect(revalidateTag).toHaveBeenCalledWith("published-pages", expect.anything());
  });

  it("套餐失效按用户隔离，不波及别人", () => {
    invalidateUserPlan("u1");
    expect(revalidateTag).toHaveBeenCalledWith("user-plan:u1", expect.anything());
  });

  // 这条是本文件里最重要的断言。
  // Next 16 推荐的 profile="max" 是 stale-while-revalidate：失效后下一次访问
  // 仍会先供旧内容。对「禁用账号」「取消发布」而言，多供一次旧内容
  // 就是内容该消失却还在——一次真实的合规事故。
  it("失效必须立即过期，不得退化成 stale-while-revalidate", () => {
    for (const call of [
      () => invalidatePublishedPage("acme"),
      () => invalidateAllPublishedPages(),
      () => invalidateUserPlan("u1"),
    ]) {
      revalidateTag.mockClear();
      call();
      const [, profile] = revalidateTag.mock.calls[0];
      expect(profile).toEqual({ expire: 0 });
      expect(profile).not.toBe("max");
    }
  });
});
