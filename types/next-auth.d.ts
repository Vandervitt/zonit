import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/plans";
import type { UserRole } from "@/lib/constants/auth";

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
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan: PlanId;
    role: UserRole;
    billingExpiresAt?: string | null;
    hasSubscription?: boolean;
  }
}
