// Creem provider 占位。Creem KYC 已通过、留作备份渠道，但产品与提现尚未就绪，
// 暂不实现具体逻辑。super-admin 切到 creem 时 isConfigured() 返回 false，
// 结账/门户接口据此给出「渠道未配置」的明确报错，而非静默失败。
import type { BillingEvent, BillingProvider } from "../types";

const NOT_IMPLEMENTED = "Creem 收款渠道尚未配置（占位）。请在 super-admin 切回 Dodo，或先在 Creem 完成产品与提现设置。";

export const creemProvider: BillingProvider = {
  id: "creem",
  isConfigured(): boolean {
    return false;
  },
  async createCheckout(): Promise<string> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async getPortalUrl(): Promise<string> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async verifyAndParse(): Promise<BillingEvent> {
    throw new Error(NOT_IMPLEMENTED);
  },
};
