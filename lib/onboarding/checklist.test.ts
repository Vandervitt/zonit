import { describe, it, expect } from "vitest";
import {
  computeOnboardingSteps,
  isOnboardingComplete,
  type OnboardingInput,
} from "./checklist";

const empty: OnboardingInput = { milestones: [], domains: [] };

function stepDone(input: OnboardingInput, id: string): boolean {
  return computeOnboardingSteps(input).find((s) => s.id === id)!.done;
}

describe("computeOnboardingSteps", () => {
  it("新账号四步全未完成", () => {
    const steps = computeOnboardingSteps(empty);
    expect(steps.map((s) => s.id)).toEqual([
      "page_created",
      "publish_address",
      "page_published",
      "first_lead",
    ]);
    expect(steps.every((s) => !s.done)).toBe(true);
  });

  it("建页/发布/首线索三步取自里程碑", () => {
    const input: OnboardingInput = {
      milestones: ["page_created", "page_published", "first_lead"],
      domains: [],
    };
    expect(stepDone(input, "page_created")).toBe(true);
    expect(stepDone(input, "page_published")).toBe(true);
    expect(stepDone(input, "first_lead")).toBe(true);
  });

  // 本次缺陷的核心：平台子域刻意不记 domain_verified 里程碑，
  // 若「拿到发布地址」仍按里程碑判定，零门槛路径的用户永远不打勾。
  it("只领了平台子域也算「拿到发布地址」", () => {
    const input: OnboardingInput = {
      milestones: [],
      domains: [{ verified: false, isPlatformSubdomain: true }],
    };
    expect(stepDone(input, "publish_address")).toBe(true);
  });

  it("已验证的自有域名同样算「拿到发布地址」", () => {
    const input: OnboardingInput = {
      milestones: [],
      domains: [{ verified: true, isPlatformSubdomain: false }],
    };
    expect(stepDone(input, "publish_address")).toBe(true);
  });

  it("只有未验证的自有域名不算", () => {
    const input: OnboardingInput = {
      milestones: [],
      domains: [{ verified: false, isPlatformSubdomain: false }],
    };
    expect(stepDone(input, "publish_address")).toBe(false);
  });

  it("domain_verified 里程碑本身不再参与判定（存量用户靠域名状态命中）", () => {
    const input: OnboardingInput = {
      milestones: ["domain_verified"],
      domains: [],
    };
    expect(stepDone(input, "publish_address")).toBe(false);
  });
});

describe("isOnboardingComplete", () => {
  it("零门槛路径（平台子域）也能走完四步并让清单消失", () => {
    const input: OnboardingInput = {
      milestones: ["page_created", "page_published", "first_lead"],
      domains: [{ verified: false, isPlatformSubdomain: true }],
    };
    expect(isOnboardingComplete(computeOnboardingSteps(input))).toBe(true);
  });

  it("缺任意一步都不算完成", () => {
    const input: OnboardingInput = {
      milestones: ["page_created", "page_published"],
      domains: [{ verified: false, isPlatformSubdomain: true }],
    };
    expect(isOnboardingComplete(computeOnboardingSteps(input))).toBe(false);
  });
});
