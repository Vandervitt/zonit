import { describe, it, expect } from "vitest";
import { handleAuth } from "./auth-proxy";
import { UserRole } from "@/lib/constants";

type ReqOpts = { loggedIn?: boolean; role?: UserRole; method?: string };
type HandleAuthReq = Parameters<typeof handleAuth>[0];

function makeReq(pathname: string, opts: ReqOpts = {}): HandleAuthReq {
  return {
    nextUrl: { pathname },
    url: `https://app.example.com${pathname}`,
    method: opts.method ?? "GET",
    auth: opts.loggedIn ? { user: { role: opts.role ?? UserRole.USER } } : null,
  } as unknown as HandleAuthReq;
}

const locationOf = (res: unknown) =>
  (res as Response | null)?.headers.get("location") ?? null;

describe("handleAuth 首页重定向", () => {
  it("已登录访问 / 不再自动跳转（放行展示营销首页）", () => {
    expect(handleAuth(makeReq("/", { loggedIn: true }))).toBeNull();
  });

  it("未登录访问 / 放行", () => {
    expect(handleAuth(makeReq("/"))).toBeNull();
  });
});

describe("handleAuth 登录/注册页在已登录时跳转 /admin", () => {
  it("已登录访问 /login → 重定向 /admin", () => {
    const res = handleAuth(makeReq("/login", { loggedIn: true }));
    expect(locationOf(res)).toBe("https://app.example.com/admin");
  });

  it("已登录访问 /register → 重定向 /admin", () => {
    const res = handleAuth(makeReq("/register", { loggedIn: true }));
    expect(locationOf(res)).toBe("https://app.example.com/admin");
  });

  it("未登录访问 /login 放行（公开）", () => {
    expect(handleAuth(makeReq("/login"))).toBeNull();
  });

  it("未登录访问 /register 放行（公开）", () => {
    expect(handleAuth(makeReq("/register"))).toBeNull();
  });
});

describe("handleAuth 既有守卫不回归", () => {
  it("未登录访问 /admin → 重定向 /login", () => {
    const res = handleAuth(makeReq("/admin"));
    expect(locationOf(res)).toBe("https://app.example.com/login");
  });

  it("未登录访问 /admin 子路径 → 重定向 /login", () => {
    const res = handleAuth(makeReq("/admin/domains"));
    expect(locationOf(res)).toBe("https://app.example.com/login");
  });

  it("普通用户访问 /super-admin → 重定向 /admin", () => {
    const res = handleAuth(makeReq("/super-admin", { loggedIn: true, role: UserRole.USER }));
    expect(locationOf(res)).toBe("https://app.example.com/admin");
  });

  it("超管访问 /super-admin → 放行", () => {
    expect(
      handleAuth(makeReq("/super-admin", { loggedIn: true, role: UserRole.SUPER_ADMIN })),
    ).toBeNull();
  });
});

describe("handleAuth 公开路径按段边界匹配", () => {
  it("公开条目本身命中：/preview 放行", () => {
    expect(handleAuth(makeReq("/preview"))).toBeNull();
  });

  it("公开条目子路径命中：/preview/<token> 放行", () => {
    expect(handleAuth(makeReq("/preview/abc.123.def"))).toBeNull();
  });

  it("公开条目子路径命中：/p/<slug> 放行", () => {
    expect(handleAuth(makeReq("/p/my-slug"))).toBeNull();
  });

  it("/pricing 经自身条目放行（不再依赖 /p 前缀误伤）", () => {
    expect(handleAuth(makeReq("/pricing"))).toBeNull();
  });

  it("/anti-ban 营销公开页放行", () => {
    expect(handleAuth(makeReq("/anti-ban"))).toBeNull();
  });

  it("/api/auth 子路径放行：/api/auth/callback/google", () => {
    expect(handleAuth(makeReq("/api/auth/callback/google"))).toBeNull();
  });

  it("未登记的未知路由放行交给 Next 渲染 not-found（未登录不再跳登录）：/premium", () => {
    expect(handleAuth(makeReq("/premium"))).toBeNull();
  });

  it("未知路由已登录同样放行渲染 404：/premium", () => {
    expect(handleAuth(makeReq("/premium", { loggedIn: true }))).toBeNull();
  });

  it("任意未知路由未登录放行（不跳登录）：/__definitely_not_a_route__", () => {
    expect(handleAuth(makeReq("/__definitely_not_a_route__"))).toBeNull();
  });

  it("/api/cron 子路径放行（各路由自身 CRON_SECRET 鉴权）：/api/cron/webhook-flush", () => {
    expect(handleAuth(makeReq("/api/cron/webhook-flush"))).toBeNull();
  });

  it("非 cron 的受保护 /api 未登录仍 401：/api/domains", () => {
    const res = handleAuth(makeReq("/api/domains"));
    expect((res as Response | null)?.status).toBe(401);
  });
});
