import { describe, it, expect } from "vitest";
import { handleAuth } from "./auth-proxy";
import { UserRole } from "@/lib/constants";

type ReqOpts = {
  loggedIn?: boolean;
  role?: UserRole;
  method?: string;
  search?: string;
  localeCookie?: string;
  referer?: string;
};
type HandleAuthReq = Parameters<typeof handleAuth>[0];

function makeReq(pathname: string, opts: ReqOpts = {}): HandleAuthReq {
  const search = opts.search ?? "";
  return {
    nextUrl: { pathname, search, searchParams: new URLSearchParams(search) },
    url: `https://app.example.com${pathname}${search}`,
    method: opts.method ?? "GET",
    cookies: { get: (name: string) => (name === "zb_locale" && opts.localeCookie ? { value: opts.localeCookie } : undefined) },
    headers: new Headers(opts.referer ? { referer: opts.referer } : {}),
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

describe("handleAuth 中文镜像路由", () => {
  it("已登录访问 /zh/login → 重定向 /admin", () => {
    const res = handleAuth(makeReq("/zh/login", { loggedIn: true }));
    expect(locationOf(res)).toBe("https://app.example.com/admin");
  });

  it("已登录访问 /zh/register → 重定向 /admin", () => {
    const res = handleAuth(makeReq("/zh/register", { loggedIn: true }));
    expect(locationOf(res)).toBe("https://app.example.com/admin");
  });

  it("未登录访问 /zh/login 放行（公开）", () => {
    expect(handleAuth(makeReq("/zh/login"))).toBeNull();
  });

  it("/zh 首页始终放行", () => {
    expect(handleAuth(makeReq("/zh"))).toBeNull();
    expect(handleAuth(makeReq("/zh", { loggedIn: true }))).toBeNull();
  });

  it("/zh/admin 不被当作受保护后台——它不是已注册路由，交给 Next 出 404", () => {
    expect(handleAuth(makeReq("/zh/admin"))).toBeNull();
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
  it("未登录访问 /admin → 重定向 /login 并带回跳", () => {
    const res = handleAuth(makeReq("/admin"));
    expect(locationOf(res)).toBe("https://app.example.com/login?callbackUrl=%2Fadmin");
  });

  it("未登录访问 /admin 子路径 → 重定向 /login 并带回跳", () => {
    const res = handleAuth(makeReq("/admin/domains"));
    expect(locationOf(res)).toBe("https://app.example.com/login?callbackUrl=%2Fadmin%2Fdomains");
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

  it("支付 webhook 端点未登录放行（靠签名验签鉴权）：/api/webhooks/dodo", () => {
    expect(handleAuth(makeReq("/api/webhooks/dodo", { method: "POST" }))).toBeNull();
  });

  it("支付 webhook 端点未登录放行：/api/webhooks/creem", () => {
    expect(handleAuth(makeReq("/api/webhooks/creem", { method: "POST" }))).toBeNull();
  });
});

describe("handleAuth 登录回跳（模板选择不丢失）", () => {
  it("未登录点模板深链 → /login 携带完整路径与查询串", () => {
    const res = handleAuth(makeReq("/admin/landing-pages", { search: "?template=b2b-sourcing" }));
    expect(locationOf(res)).toBe(
      "https://app.example.com/login?callbackUrl=%2Fadmin%2Flanding-pages%3Ftemplate%3Db2b-sourcing",
    );
  });

  it("未登录访问 /super-admin → /login 携带回跳", () => {
    const res = handleAuth(makeReq("/super-admin/users"));
    expect(locationOf(res)).toBe("https://app.example.com/login?callbackUrl=%2Fsuper-admin%2Fusers");
  });

  it("语言 cookie 为 zh → 跳中文登录页", () => {
    const res = handleAuth(makeReq("/admin/landing-pages", { search: "?template=pet", localeCookie: "zh" }));
    expect(locationOf(res)).toBe(
      "https://app.example.com/zh/login?callbackUrl=%2Fadmin%2Flanding-pages%3Ftemplate%3Dpet",
    );
  });

  it("从 /zh 页面点进来 → 跳中文登录页", () => {
    const res = handleAuth(makeReq("/admin/landing-pages", {
      search: "?template=pet",
      referer: "https://app.example.com/zh/templates/pet",
    }));
    expect(locationOf(res)).toBe(
      "https://app.example.com/zh/login?callbackUrl=%2Fadmin%2Flanding-pages%3Ftemplate%3Dpet",
    );
  });

  it("显式选了英文的 cookie 优先于中文来源页", () => {
    const res = handleAuth(makeReq("/admin", { localeCookie: "en", referer: "https://app.example.com/zh/templates/pet" }));
    expect(locationOf(res)).toBe("https://app.example.com/login?callbackUrl=%2Fadmin");
  });

  it("外站 referer 的 /zh 路径不算中文来源", () => {
    const res = handleAuth(makeReq("/admin", { referer: "https://evil.com/zh/x" }));
    expect(locationOf(res)).toBe("https://app.example.com/login?callbackUrl=%2Fadmin");
  });

  it("已登录访问带回跳的登录页 → 直接去回跳地址", () => {
    const res = handleAuth(makeReq("/zh/login", {
      loggedIn: true,
      search: "?callbackUrl=%2Fadmin%2Flanding-pages%3Ftemplate%3Dpet",
    }));
    expect(locationOf(res)).toBe("https://app.example.com/admin/landing-pages?template=pet");
  });

  it("已登录访问带非法回跳的登录页 → 回落 /admin，不外跳", () => {
    const res = handleAuth(makeReq("/login", { loggedIn: true, search: "?callbackUrl=%2F%2Fevil.com" }));
    expect(locationOf(res)).toBe("https://app.example.com/admin");
  });
});
