import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { handleTenancy } from "@/lib/proxy/tenant-proxy";
import { handleAuth } from "@/lib/proxy/auth-proxy";

export const proxy = auth(async (req) => {
  // 1. Handle Multi-tenancy (Rewrites)
  const tenancyResponse = await handleTenancy(req);
  if (tenancyResponse) return tenancyResponse;

  // 2. Handle Auth & Authorization
  const authResponse = handleAuth(req);
  if (authResponse) return authResponse;

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default proxy;
