// landing-editor/lib/publishIssues.ts
// 发布门槛的统一校验汇总：结构校验（必须模块/唯一性/至少其一）+ 字段格式校验。
// ValidationBar 展示与「发布」按钮拦截共用同一份结果，确保「校验通过」即「可发布」。

import {
  validateSections,
  SECTION_REGISTRY,
  type RequiredGroup,
  type LandingPageDraft,
} from "@/types/schema.draft";
import { collectFieldIssues } from "./validate";
import { collectTrackingIssues } from "./trackingIssues";
import { collectContactIssues } from "./contactIssues";

const groupLabels: Record<RequiredGroup, string> = {
  "core-value": "套餐 或 特性",
};

/** 结构层问题（缺必须模块 / 重复单例 / 未满足至少其一）转为可读文案。 */
export function collectStructureIssues(draft: LandingPageDraft): string[] {
  const r = validateSections(draft.sections);
  const issues: string[] = [];
  r.unsatisfiedGroups.forEach((g) => issues.push(`需至少一个：${groupLabels[g] ?? g}`));
  r.duplicatedSingletons.forEach((t) => issues.push(`「${SECTION_REGISTRY[t].label}」应唯一，出现多次`));
  r.missingRequired.forEach((t) => issues.push(`缺少必须模块「${SECTION_REGISTRY[t].label}」`));
  return issues;
}

/** 发布门槛的全部未通过项；为空表示可以发布。 */
export function collectPublishIssues(draft: LandingPageDraft): string[] {
  return [
    ...collectStructureIssues(draft),
    ...collectFieldIssues(draft),
    ...collectTrackingIssues(draft),
    ...collectContactIssues(draft),
  ];
}
