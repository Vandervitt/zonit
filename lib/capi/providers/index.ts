// lib/capi/providers/index.ts
import type { CapiProvider, CapiProviderId } from "../types";
import { metaProvider } from "./meta";
import { tiktokProvider } from "./tiktok";

const REGISTRY: Record<CapiProviderId, CapiProvider> = {
  meta: metaProvider,
  tiktok: tiktokProvider,
};

export function getProvider(id: CapiProviderId): CapiProvider {
  const base = REGISTRY[id];
  // CAPI_FAKE=1（测试/本地）：不打真实平台网络，send 直接成功。
  if (process.env.CAPI_FAKE === "1") {
    return { ...base, send: async () => ({ ok: true }) };
  }
  return base;
}
