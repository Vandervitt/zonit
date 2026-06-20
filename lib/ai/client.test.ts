import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setAiClient, getAiClient, resetAiClient, resolveProvider } from "@/lib/ai/client";

describe("ai client 注入", () => {
  beforeEach(() => resetAiClient());

  it("可注入 fake 并被 getAiClient 返回", async () => {
    setAiClient({
      async completeJson<T>(): Promise<T> {
        return { slots: [{ id: "hero.title", text: "FAKE" }] } as unknown as T;
      },
    });
    const out = await getAiClient().completeJson({ system: "s", user: "u", schema: {}, schemaName: "x" });
    expect(out).toEqual({ slots: [{ id: "hero.title", text: "FAKE" }] });
  });
});

describe("resolveProvider", () => {
  const saved = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    QWEN_MODEL: process.env.QWEN_MODEL,
    QWEN_BASE_URL: process.env.QWEN_BASE_URL,
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
  };
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("默认走 OpenAI，严格 json_schema", () => {
    delete process.env.AI_PROVIDER;
    const cfg = resolveProvider();
    expect(cfg.model).toBe("gpt-4o-mini");
    expect(cfg.strictJsonSchema).toBe(true);
  });

  it("AI_PROVIDER=qwen 走 DashScope 兼容端点，关闭严格 schema", () => {
    process.env.AI_PROVIDER = "qwen";
    process.env.DASHSCOPE_API_KEY = "sk-test";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("qwen-plus");
    expect(cfg.strictJsonSchema).toBe(false);
    expect(cfg.baseURL).toContain("dashscope.aliyuncs.com");
    expect(cfg.apiKey).toBe("sk-test");
  });

  it("qwen 模型与端点可被 env 覆盖", () => {
    process.env.AI_PROVIDER = "qwen";
    process.env.QWEN_MODEL = "qwen-max";
    process.env.QWEN_BASE_URL = "https://example.test/v1";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("qwen-max");
    expect(cfg.baseURL).toBe("https://example.test/v1");
  });
});
