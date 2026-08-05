import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/plans";
import type { UserRole } from "@/lib/constants/auth";
import type { Locale } from "@/lib/i18n/config";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: PlanId;
      role: UserRole;
      /** 周期末取消的权益到期时间（ISO）；未取消为 null。 */
      billingExpiresAt: string | null;
      /** 是否持有渠道真实订阅（赠送套餐为 false）；控制 billing 页换档区显隐。 */
      hasSubscription: boolean;
      /** 付费订阅档位（不含赠送）；billing 页换档基准，plan 为含赠送的生效档。 */
      paidPlan: PlanId;
      /** 生效中的超管赠送档（已过期为 null）。 */
      compPlan: PlanId | null;
      /** 赠送到期时间（ISO）；永久赠送或无赠送为 null。 */
      compPlanExpiresAt: string | null;
      /**
       * 后台界面语言（users.locale）。null = 从未表过态，由 resolveAdminLocale
       * 回退到注册来源 cookie。不要在这里就地回退成默认语言——那会抹掉
       * "没选过"与"选了英文"的区别。
       */
      locale: Locale | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan: PlanId;
    role: UserRole;
    billingExpiresAt?: string | null;
    hasSubscription?: boolean;
    paidPlan?: PlanId;
    compPlan?: PlanId | null;
    compPlanExpiresAt?: string | null;
    locale?: Locale | null;
  }
}
