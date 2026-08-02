// 把改造前的 52 套模板 draft 冻结成 JSON，供等价性回归与回滚对照使用。
//
// 只跑一次，且必须在 schema 改造之前跑 —— 一旦 CtaButton.link 被移除，
// 就再也拿不到旧形状的 draft 了。产物进 git 后不再重新生成：它是死数据，
// 不随代码演进失效，这正是它作为等价性判据输入的价值所在。
//
// 用法：npx tsx scripts/freeze-draft-fixture.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { TEMPLATES } from "../landing-editor/samples/registry";
import { loadTemplateDraft } from "../landing-editor/samples/registry.drafts";

async function main() {
  const out: Record<string, unknown> = {};
  for (const t of TEMPLATES) out[t.id] = await loadTemplateDraft(t.id);
  mkdirSync("test/fixtures", { recursive: true });
  writeFileSync("test/fixtures/drafts-pre-contact.json", JSON.stringify(out, null, 2));
  console.log(`冻结 ${Object.keys(out).length} 套模板 draft`);
}

main();
