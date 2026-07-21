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
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan: PlanId;
    role: UserRole;
    billingExpiresAt?: string | null;
  }
}
