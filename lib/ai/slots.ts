import type { LandingPageDraft } from "@/types/schema.draft";
import type { Slot, FilledSlot } from "./types";

/**
 * 这些键不是营销文案，连同其子树一并跳过：图片/链接/枚举/标识/图标/时间。
 * `alt` 为图片辅助文字，随图片一起编辑，不开放 AI 单独改写。
 */
const NON_TEXT_KEYS = new Set([
  "src", "link", "poster", "id", "provider", "type",
  "endsAt", "alt", "icon", "emoji", "channel",
]);

/** 递归抽取所有营销文案字段。 */
export function deriveSlots(draft: LandingPageDraft): Slot[] {
  const slots: Slot[] = [];

  const walk = (value: unknown, path: (string | number)[]) => {
    if (typeof value === "string") {
      const key = String(path[path.length - 1] ?? "");
      if (NON_TEXT_KEYS.has(key)) return;
      slots.push({ id: path.join("."), path: [...path], label: key, text: value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, [...path, i]));
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (NON_TEXT_KEYS.has(k)) continue; // 黑名单键跳过整棵子树，与字符串分支语义一致
        walk(v, [...path, k]);
      }
    }
  };

  walk(draft as unknown, []);
  return slots;
}

/** 把回填文案合并回 draft（深拷贝，不改原对象）。未知 id 忽略。 */
export function mergeSlots(
  draft: LandingPageDraft,
  filled: Array<Slot | FilledSlot>,
): LandingPageDraft {
  const clone: LandingPageDraft = structuredClone(draft);
  const byId = new Map<string, (string | number)[]>(
    deriveSlots(draft).map((s) => [s.id, s.path]),
  );

  for (const f of filled) {
    const path = "path" in f ? f.path : byId.get(f.id);
    if (!path) continue;

    let cur: Record<string, unknown> | unknown[] = clone as unknown as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (Array.isArray(cur)) {
        cur = (cur as unknown[])[segment as number] as Record<string, unknown> | unknown[];
      } else {
        cur = (cur as Record<string, unknown>)[segment as string] as Record<string, unknown> | unknown[];
      }
      if (cur === null || typeof cur !== "object") break;
    }

    if (cur !== null && typeof cur === "object") {
      const lastKey = path[path.length - 1];
      if (Array.isArray(cur)) {
        (cur as unknown[])[lastKey as number] = f.text;
      } else {
        (cur as Record<string, unknown>)[lastKey as string] = f.text;
      }
    }
  }
  return clone;
}
