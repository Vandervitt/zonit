// lib/landing-pages/policy-paths.ts
//
// 政策子页的地址规则（隐私政策 / 服务条款）。
//
// 为什么要有独立子页：四家平台（Meta / Google / TikTok / LinkedIn）都要求落地页
// 能给出可访问的隐私政策与条款，而页脚里的纯文本段落不构成「可达」——我们自己的
// 落地页自检器（lib/tools/checks.ts findPolicyLinks）只认 <a>，实测判我们自己的
// 生成页 privacy_missing + terms_missing。政策文案模板早已写好，缺的只是一个 URL。
//
// 解析（proxy）与生成（页脚链接）必须共用本文件，否则会出现「页脚有链接但点开 404」。

/** 政策子页种类。路径段与种类名同字面量，故 kind 本身即 URL 末段。 */
export const POLICY_KINDS = ["privacy", "terms"] as const;
export type PolicyKind = (typeof POLICY_KINDS)[number];

const KIND_SET = new Set<string>(POLICY_KINDS);

/**
 * 政策子页地址：落地页发布在 `/` 时为 `/privacy`，发布在 `/invisalign` 时为
 * `/invisalign/privacy`。base 也可以是预览前缀（`/preview/{token}`）。
 */
export function policyPath(basePath: string, kind: PolicyKind): string {
  const base = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  return `${base}/${kind}`;
}

/**
 * 反解政策子页路径 → 落地页所在路径 + 种类。非政策路径返回 null。
 *
 * `/privacy` → `{ parentPath: "/", kind: "privacy" }`
 * `/invisalign/terms` → `{ parentPath: "/invisalign", kind: "terms" }`
 */
export function splitPolicyPath(path: string): { parentPath: string; kind: PolicyKind } | null {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const last = segments[segments.length - 1];
  if (!KIND_SET.has(last)) return null;
  const parent = segments.slice(0, -1);
  return {
    parentPath: parent.length === 0 ? "/" : `/${parent.join("/")}`,
    kind: last as PolicyKind,
  };
}
