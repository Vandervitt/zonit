// 上手清单的判定逻辑（纯函数，渲染在 app/admin/(workspace)/page.tsx）。
//
// ⚠️ 四步不同源，这是有意的：
//   - 建页 / 发布 / 首线索 取自 platform_milestones（「曾经完成过」的事件语义）
//   - 「拿到发布地址」取自 domains 的**实时状态**，不查里程碑
//
// 后者的原因：平台子域刻意不记 domain_verified 里程碑（掺入平台分配的子域会让
// 激活漏斗在上线前后不可比，见 app/api/domains/platform-subdomain/route.ts）。
// 清单若跟着查该里程碑，走零门槛路径的用户（领子域 → 发布 → 收线索）这一步
// 永远不打勾、清单永不消失，还会催他去做子域功能刚替他省掉的绑域名。
// 而「有没有一个能发布的地址」本来就是状态而非事件，用实时状态判定更贴语义。
import type { MilestoneEvent } from "@/lib/platform-milestones";

export const ONBOARDING_STEP_IDS = [
  "page_created",
  "publish_address",
  "page_published",
  "first_lead",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export interface OnboardingDomain {
  verified: boolean;
  isPlatformSubdomain: boolean;
}

export interface OnboardingInput {
  milestones: MilestoneEvent[];
  domains: OnboardingDomain[];
}

export interface OnboardingStep {
  id: OnboardingStepId;
  done: boolean;
}

/** 有可发布的地址：已验证的自有域名，或平台分配的子域（后者天然可用，无需验证）。 */
function hasPublishAddress(domains: OnboardingDomain[]): boolean {
  return domains.some((d) => d.verified || d.isPlatformSubdomain);
}

export function computeOnboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const achieved = new Set(input.milestones);
  return ONBOARDING_STEP_IDS.map((id) => ({
    id,
    done:
      id === "publish_address"
        ? hasPublishAddress(input.domains)
        : achieved.has(id as MilestoneEvent),
  }));
}

export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every((s) => s.done);
}
