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

describe("resolveProvider（通用配置驱动 + 预设）", () => {
  // 隔离所有相关 env：每个用例前清空，afterEach 全量还原。
  const KEYS = [
    "AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "AI_JSON_MODE",
    "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL",
    "DASHSCOPE_API_KEY", "QWEN_API_KEY",
    "GEMINI_API_KEY", "GOOGLE_API_KEY",
    "DEEPSEEK_API_KEY",
  ];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("默认走 OpenAI，严格 json_schema", () => {
    process.env.OPENAI_API_KEY = "sk-openai";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("gpt-4o-mini");
    expect(cfg.strictJsonSchema).toBe(true);
    expect(cfg.baseURL).toBeUndefined(); // 官方端点
    expect(cfg.apiKey).toBe("sk-openai");
  });

  it("预设 qwen：DashScope 兼容端点 + json_object", () => {
    process.env.AI_PROVIDER = "qwen";
    process.env.DASHSCOPE_API_KEY = "sk-qwen";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("qwen-plus");
    expect(cfg.strictJsonSchema).toBe(false);
    expect(cfg.baseURL).toContain("dashscope.aliyuncs.com");
    expect(cfg.apiKey).toBe("sk-qwen");
  });

  it("预设 gemini：OpenAI 兼容端点 + json_object", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "sk-gemini";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("gemini-2.0-flash");
    expect(cfg.strictJsonSchema).toBe(false);
    expect(cfg.baseURL).toContain("generativelanguage.googleapis.com");
    expect(cfg.apiKey).toBe("sk-gemini");
  });

  it("通用 AI_* 覆盖一切：零代码接任意兼容源", () => {
    process.env.AI_BASE_URL = "https://my-gateway.test/v1";
    process.env.AI_API_KEY = "sk-generic";
    process.env.AI_MODEL = "some-model";
    process.env.AI_JSON_MODE = "json_object";
    const cfg = resolveProvider();
    expect(cfg.baseURL).toBe("https://my-gateway.test/v1");
    expect(cfg.apiKey).toBe("sk-generic");
    expect(cfg.model).toBe("some-model");
    expect(cfg.strictJsonSchema).toBe(false);
  });

  it("通用 AI_* 优先于预设默认", () => {
    process.env.AI_PROVIDER = "qwen";
    process.env.AI_MODEL = "qwen-max";
    process.env.AI_BASE_URL = "https://override.test/v1";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("qwen-max");
    expect(cfg.baseURL).toBe("https://override.test/v1");
  });

  it("未知 provider 回退 openai 预设", () => {
    process.env.AI_PROVIDER = "nope";
    const cfg = resolveProvider();
    expect(cfg.model).toBe("gpt-4o-mini");
    expect(cfg.strictJsonSchema).toBe(true);
  });

  it("OPENAI_* 仅作用于 openai，不泄漏到其它源", () => {
    process.env.AI_PROVIDER = "qwen";
    process.env.OPENAI_BASE_URL = "https://api.openai.com/leak";
    process.env.OPENAI_MODEL = "gpt-4o";
    process.env.DASHSCOPE_API_KEY = "sk-qwen";
    const cfg = resolveProvider();
    expect(cfg.baseURL).toContain("dashscope.aliyuncs.com"); // 未被 OPENAI_BASE_URL 污染
    expect(cfg.model).toBe("qwen-plus");                      // 未被 OPENAI_MODEL 污染
  });
});
