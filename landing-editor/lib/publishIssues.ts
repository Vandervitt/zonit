// landing-editor/lib/publishIssues.ts
// 发布门槛的统一校验汇总：结构校验（必须模块/唯一性/至少其一）+ 字段格式校验。
// ValidationBar 展示与「发布」按钮拦截共用同一份结果，确保「校验通过」即「可发布」。

import { defaultIssuesDict, type IssuesDict } from "./validate";
import {
  validateSections,
  SECTION_REGISTRY,
  type RequiredGroup,
  type LandingPageDraft,
} from "@/types/schema.draft";
import { collectFieldIssueItems, type PublishIssue } from "./validate";
import { collectTrackingIssues } from "./trackingIssues";
import { collectContactIssueItems } from "./contactIssues";

export type { PublishIssue, IssueTarget } from "./validate";

const groupLabels: Record<RequiredGroup, string> = {
  "core-value": "core-value",
};

/** 结构层问题（缺必须模块 / 重复单例 / 未满足至少其一）转为可读文案。 */
export function collectStructureIssues(draft: LandingPageDraft, t: IssuesDict = defaultIssuesDict): string[] {
  const r = validateSections(draft.sections);
  const issues: string[] = [];
  r.unsatisfiedGroups.forEach((g) => issues.push(t.needAtLeastOne(g === "core-value" ? t.coreValue : groupLabels[g] ?? g)));
  r.duplicatedSingletons.forEach((type) => issues.push(t.duplicatedSingleton(t.sections[type])));
  r.missingRequired.forEach((type) => issues.push(t.missingRequired(t.sections[type])));
  return issues;
}

/**
 * 发布门槛的全部未通过项（结构化）；为空表示可以发布。带 target 的项可在编辑器内
 * 点击跳转对应模块；结构类 / 追踪类 / 占位号扫描无明确落点，不带 target。
 */
export function collectPublishIssueItems(draft: LandingPageDraft, t: IssuesDict = defaultIssuesDict): PublishIssue[] {
  return [
    ...collectStructureIssues(draft, t).map((message) => ({ message })),
    ...collectFieldIssueItems(draft, t),
    ...collectTrackingIssues(draft, t).map((message) => ({ message })),
    ...collectContactIssueItems(draft, t),
  ];
}

/** 发布门槛的全部未通过项（纯文案，与 collectPublishIssueItems 同源）；为空表示可以发布。 */
export function collectPublishIssues(draft: LandingPageDraft, t: IssuesDict = defaultIssuesDict): string[] {
  return collectPublishIssueItems(draft, t).map((i) => i.message);
}
