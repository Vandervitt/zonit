// 把 52 套模板样稿从 { text, link } 改写成 { text, target } + 页面级 contact。
//
// 只跑一次；产物提交后本脚本保留作为改造记录。
// 渠道识别复用 lib/contact/convert-draft.ts 的 parseLegacyLink，与运行时迁移同一口径
// —— 两处若各写一套正则，模板和用户数据迟早转出不同结果。
//
// 用法：
//   npx tsx scripts/convert-template-drafts.ts          # 只报告，不写文件
//   npx tsx scripts/convert-template-drafts.ts --apply   # 实际改写
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { parseLegacyLink } from "../lib/contact/convert-draft";
import type { LeadChannel } from "../types/schema.draft";

const DIR = "landing-editor/samples";
const APPLY = process.argv.includes("--apply");

/** 常量声明：单行 `const X = "…";` 或跨行 `const X =\n  "…";` 两种写法都要吃下。 */
const CONST_DECL = /^const ([A-Z_]+)\s*=\s*\n?\s*"([^"]*)";\n/gm;

interface Report {
  file: string;
  contact: Record<string, string>;
  primary: LeadChannel;
  replaced: number;
  unresolved: string[];
}

function convert(src: string, file: string): { out: string; report: Report } {
  // ① 收集常量
  const consts = new Map<string, string>();
  for (const m of src.matchAll(CONST_DECL)) consts.set(m[1], m[2]);

  // ② 主渠道 = hero 的 cta 指向的那个。hero 是 draft 的第一个键，故取第一个 cta。
  const heroCta = src.match(/cta:\s*\{[^}]*link:\s*([A-Z_]+|"[^"]*")/);
  const heroLinkRaw = heroCta?.[1] ?? "";
  const heroLink = heroLinkRaw.startsWith('"') ? heroLinkRaw.slice(1, -1) : (consts.get(heroLinkRaw) ?? "");
  const heroParsed = parseLegacyLink(heroLink);
  const primary: LeadChannel = heroParsed?.channel ?? "whatsapp";

  // ③ contact：把各常量的值收进来（同一渠道只收一个——模板里本就至多一个）
  const contact: Record<string, string> = {};
  for (const value of consts.values()) {
    const parsed = parseLegacyLink(value);
    if (parsed && parsed.channel !== "form" && !contact[parsed.channel]) {
      contact[parsed.channel] = parsed.value;
    }
  }

  // ④ 页脚邮箱并入 contact 并删除该字段
  const footerEmail = src.match(/^\s*contactEmail:\s*"([^"]*)",\n/m);
  if (footerEmail && !contact.email) contact.email = footerEmail[1];
  let out = footerEmail ? src.replace(footerEmail[0], "") : src;

  // ⑤ 落点改写
  const report: Report = { file, contact, primary, replaced: 0, unresolved: [] };
  /**
   * @param pinChannel 悬浮按钮专用：钉死渠道而不是跟随主渠道。
   *   阶段 2 用户把主渠道改成表单时，悬浮按钮必须仍是 WhatsApp ——
   *   「主推表单收结构化线索 + 悬浮 WhatsApp 接住想直接问一句的访客」
   *   正是这次改造要支持的核心组合，跟随主渠道会把它毁掉。
   */
  const toTarget = (raw: string, pinChannel = false): string => {
    const link = raw.startsWith('"') ? raw.slice(1, -1) : (consts.get(raw) ?? "");
    const parsed = parseLegacyLink(link);
    if (!parsed) {
      report.unresolved.push(link);
      return `target: { kind: "url", url: ${JSON.stringify(link)} }`;
    }
    const prefill = parsed.prefill ? `, prefill: ${JSON.stringify(parsed.prefill)}` : "";
    if (parsed.channel !== primary || (pinChannel && parsed.channel !== "form")) {
      return `target: { kind: "channel", channel: ${JSON.stringify(parsed.channel)}${prefill} }`;
    }
    return `target: { kind: "primary"${prefill} }`;
  };

  // 先处理悬浮按钮（钉死渠道），再处理其余落点（跟随主渠道）
  out = out.replace(/(floatingButton:\s*\{[\s\S]*?)link:\s*([A-Z_]+|"[^"]*")/, (_m, head: string, raw: string) => {
    report.replaced += 1;
    return head + toTarget(raw, true);
  });
  out = out.replace(/link:\s*([A-Z_]+|"[^"]*")/g, (_m, raw: string) => {
    report.replaced += 1;
    return toTarget(raw);
  });

  // ⑥ 删掉已经内联掉的常量声明
  out = out.replace(CONST_DECL, "");
  // 常量上方的 JSDoc 注释也一并删除（它描述的是刚被删掉的那行）
  out = out.replace(/^\/\*\* (?:WhatsApp|表单|电话|邮件)[^\n]*\*\/\n(?=\n|export)/gm, "");

  // ⑦ 插入 contact（置于 draft 第一个键，与 schema 里的位置一致）
  const contactLiteral = [`    primary: ${JSON.stringify(primary)},`]
    .concat(Object.entries(contact).map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`))
    .join("\n");
  out = out.replace(
    /^(export const \w+: LandingPageDraft = \{\n)/m,
    `$1  contact: {\n${contactLiteral}\n  },\n`,
  );

  return { out, report };
}

const reports: Report[] = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith("Draft.ts"))) {
  const path = `${DIR}/${file}`;
  const { out, report } = convert(readFileSync(path, "utf8"), file);
  reports.push(report);
  if (APPLY) writeFileSync(path, out);
}

const totalReplaced = reports.reduce((n, r) => n + r.replaced, 0);
const unresolved = reports.flatMap((r) => r.unresolved);
const byPrimary: Record<string, number> = {};
reports.forEach((r) => { byPrimary[r.primary] = (byPrimary[r.primary] ?? 0) + 1; });

console.log(`模板 ${reports.length} 套｜落点改写 ${totalReplaced} 处`);
console.log("主渠道分布:", byPrimary);
console.log(`未能识别为渠道的落点 ${unresolved.length} 处（转为 url，属预期：Instagram 等二级链接）`);
const noContact = reports.filter((r) => Object.keys(r.contact).length === 0);
if (noContact.length) console.log("⚠️ 没收到任何联系方式的模板:", noContact.map((r) => r.file));
if (!APPLY) console.log("\n（未写文件。加 --apply 实际改写）");
