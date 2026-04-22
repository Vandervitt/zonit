import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/plans";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: PlanId;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan: PlanId;
  }
}
