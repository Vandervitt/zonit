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
