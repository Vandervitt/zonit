// provider 注册表 + 当前生效渠道解析。
import type { BillingProvider, BillingProviderId } from "./types";
import { dodoProvider } from "./providers/dodo";
import { creemProvider } from "./providers/creem";
import { getBillingProviderId } from "@/lib/platform-settings";

const REGISTRY: Record<BillingProviderId, BillingProvider> = {
  dodo: dodoProvider,
  creem: creemProvider,
};

export function getProvider(id: BillingProviderId): BillingProvider {
  return REGISTRY[id];
}

/** 取 super-admin 当前选定的生效收款渠道实例。 */
export async function getActiveProvider(): Promise<BillingProvider> {
  return REGISTRY[await getBillingProviderId()];
}
