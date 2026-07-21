// 计费 provider 抽象层：把「谁来收款」（Dodo / Creem）从业务代码里解耦。
// active provider 存于 platform_settings（super-admin 可切换），webhook 端点各 provider 独立。
import type { PlanId } from "@/lib/plans";

export type BillingProviderId = "dodo" | "creem";

/** 规范化后的计费事件——业务侧只认这三种语义，与具体 provider 无关。 */
export type BillingEvent =
  | { kind: "subscription_activated"; userId: string; plan: PlanId; customerId?: string; subscriptionId?: string; eventTime: string | null }
  | { kind: "subscription_ended"; userId: string; eventTime: string | null } // 过期/挂起/失败/立即取消 → 回落 free
  // 周期末取消：权益保留至 expiresAt（当期结束），到期由 subscription.expired 回落。
  | { kind: "subscription_cancel_scheduled"; userId: string; expiresAt: string | null; eventTime: string | null }
  | { kind: "credit_purchased"; userId: string; credits: number }
  | { kind: "ignored" };

export interface CreateCheckoutInput {
  /** 订阅套餐 id（starter/pro/agency）。 */
  planId: string;
  email: string;
  userId: string;
  /** 当前请求 origin，用于拼 return_url。 */
  baseUrl: string;
}

export interface BillingProvider {
  readonly id: BillingProviderId;
  /** 该 provider 是否已配好必需的环境变量（未配则 super-admin 选它时给出明确报错）。 */
  isConfigured(): boolean;
  /** 创建订阅结账会话，返回可跳转的 checkout URL。 */
  createCheckout(input: CreateCheckoutInput): Promise<string>;
  /** 取客户自助管理（取消/换卡）门户 URL。 */
  getPortalUrl(customerId: string): Promise<string>;
  /** 已订阅用户升/降档：改现有订阅的 product（按比例计费），禁止另开新订阅。 */
  changePlan(subscriptionId: string, planId: string): Promise<void>;
  /** 撤销周期末取消（恢复订阅继续续费）。不支持的渠道应抛错并提示走客户门户。 */
  resume(subscriptionId: string): Promise<void>;
  /** 校验签名并把原始 webhook 解析为规范化事件；验签失败必须抛错。 */
  verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<BillingEvent>;
}
