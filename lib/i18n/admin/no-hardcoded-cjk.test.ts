// 漏译守卫：后台源码里不得再出现硬编码的中文 UI 文案。
//
// 人工走查 2700 行文案必然漏，而漏译的表现是「英文用户偶尔看到一句中文」——
// 用户不会报，我们也不会发现。故用静态扫描兜住。
//
// 只看**注释之外**的中文：这个项目的注释全是中文，那是刻意的（见 CLAUDE.md），
// 扫描必须先剥注释，否则整份清单都是噪音。
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CJK = /[一-鿿]/;

/**
 * 剥掉行注释与块注释，保留字符串与 JSX 文本。
 * 手写而非上 parser：只需要「这一行除注释外还有没有中文」这一个判断，
 * 引一个 AST 依赖不划算。
 */
function stripComments(src: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      if (c === "\\") { out += "  "; i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }
    if (c === "/" && d === "/") { while (i < src.length && src[i] !== "\n") { out += " "; i++; } continue; }
    if (c === "/" && d === "*") {
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) { out += src[i] === "\n" ? "\n" : " "; i++; }
      out += "  "; i += 2; continue;
    }
    out += c; i++;
  }
  return out;
}

/**
 * 允许保留中文的位置。每一条都必须有理由——这个清单变长就是在稀释守卫，
 * 加之前先问：这串真的不是给用户看的界面文案吗？
 */
const ALLOWED = [
  // 字典的中文侧本来就该是中文。
  /^lib\/i18n\//,
  // 帮助中心的中文章节。
  /^app\/admin\/\(workspace\)\/help\/_content\/chapters\/zh\//,
  // 邀请邮件与反馈通知刻意保持中文，理由写在 lib/email.ts 的函数注释里。
  /^lib\/email\.ts$/,
  // 测试自身要断言中文文案。
  /\.test\.tsx?$/,

  /* ---- 以下不是后台 UI，中文是内容或数据本身 ---- */

  // 模板注册表：本就是 { en, zh } 双语数据，消费方按 locale 取。
  /^landing-editor\/samples\/registry\.ts$/,
  // 营销站的中文法务正文与模板 SEO 文案。
  /^components\/marketing\/legal-content\//,
  /^lib\/seo\/template-seo-copy\.ts$/,
  // AI prompt 与配图关键词：送给模型的输入，不是界面文案。
  /^lib\/ai\//,
  // 自检器的匹配规则里含中文关键词（要认出中文落地页上的「隐私」「条款」）。
  /^lib\/tools\/checks\.ts$/,
  // 渠道链接的中文示例与提示，随落地页内容走。
  /^lib\/contact\//,
  // 素材相关的 Unsplash 查询词映射。
  /^lib\/media\/unsplash\.ts$/,
  // super-admin 是内部工具，明确保持中文（见 docs/feat_20260805_admin端国际化/design.md）。
  /^components\/admin\/InviteUserDialog\.tsx$/,
  /^lib\/super-admin\//,
  // 营销站的中文 SEO 文案与法务页，不属后台。
  /^lib\/seo\//,
  /^components\/marketing\//,
  // 自检器的中文匹配规则与诊断细节（用于识别中文落地页）。
  /^lib\/tools\//,
  // 收款渠道的能力差异说明，只在超管侧触发。
  /^lib\/billing\/providers\//,
];

/**
 * 行级豁免：这些不是界面文案，但散落在各文件里，不值得整文件豁免。
 * 加规则前先确认：这一行真的不会出现在用户界面上吗？
 */
const ALLOWED_LINE = [
  // 服务端日志。用户看不到，且中文日志便于排查。
  /console\.(error|warn|log|info)\(/,
  // 写进 SQL 的哨兵值，改了历史归因分组就对不上（见该文件注释）。
  /UNLABELED\s*=/,
  // 收款货币恒为美元，中文面附人民币参考换算。
  /approx\s*\?\s*`（约 ¥/,
  // AI 生成语言选项，是语言自称，与语言切换器同理不译。
  /^\s*"(简体中文|繁體中文|日本語)",$/,
  // 帮助中心英文章节里提到的中文 TLD（.中国）是域名后缀本身。
  /\.中国/,
  // 新建落地页的默认名，属后台内部标识，PR 范围外的独立问题。
  /未命名落地页/,
  // 线索无姓名时的占位，与线索数据同源。
  /（无姓名）/,
];

const ROOTS = ["app/admin", "landing-editor", "components", "lib"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

describe("后台源码不得硬编码中文 UI 文案", () => {
  it("扫描 app/admin、landing-editor、components、lib", () => {
    const files = ROOTS.flatMap((r) => walk(r)).filter((f) => !ALLOWED.some((re) => re.test(f)));
    // 兜底：路径写错时 files 会是空数组，测试将永真通过。
    expect(files.length).toBeGreaterThan(100);

    const offenders: string[] = [];
    for (const file of files) {
      const code = stripComments(readFileSync(file, "utf8"));
      code.split("\n").forEach((line, idx) => {
        if (!CJK.test(line)) return;
        if (ALLOWED_LINE.some((re) => re.test(line))) return;
        offenders.push(`${file}:${idx + 1}  ${line.trim().slice(0, 90)}`);
      });
    }
    // 断言列表本身而非数量：报错时直接看到是哪一行，不必再自己去搜。
    expect(offenders).toEqual([]);
  });
});
