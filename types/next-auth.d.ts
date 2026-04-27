import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/plans";
import type { UserRole } from "@/lib/constants/auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: PlanId;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan: PlanId;
    role: UserRole;
  }
}
