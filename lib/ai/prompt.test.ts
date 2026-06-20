import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildFillUserPrompt, slotFillJsonSchema } from "@/lib/ai/prompt";
import { deriveSlots } from "@/lib/ai/slots";
import { TEMPLATES } from "@/landing-editor/samples/registry";

describe("prompt 构造", () => {
  it("system prompt 含非交易护栏与不编造证据要求", () => {
    const sys = buildSystemPrompt();
    expect(sys).toMatch(/lead|留资|咨询/i);
    expect(sys).toMatch(/不得|禁止|must not/i);
  });

  it("user prompt 含 brief 与槽位 id", () => {
    const slots = deriveSlots(TEMPLATES[0].draft);
    const prompt = buildFillUserPrompt(
      { productName: "Acme", description: "B2B 咨询" },
      slots,
    );
    expect(prompt).toContain("Acme");
    expect(prompt).toContain(slots[0].id);
  });

  it("slotFillJsonSchema 是 array of {id,text}", () => {
    const schema = slotFillJsonSchema();
    expect(schema.type).toBe("object");
    expect(schema.properties.slots.type).toBe("array");
  });
});
