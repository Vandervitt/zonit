import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setAiClient, getAiClient, resetAiClient, resolveProvider, completeWithFailover, isModelUnavailable } from "@/lib/ai/client";

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

  it("AI_MODEL 支持逗号分隔多个模型（去空格、去空项），model 取第一个保持兼容", () => {
    process.env.AI_PROVIDER = "qwen";
    process.env.AI_MODEL = " qwen3.7-flash, deepseek-v4.1-flash ,,qwen3.8-flash ";
    const cfg = resolveProvider();
    expect(cfg.models).toEqual(["qwen3.7-flash", "deepseek-v4.1-flash", "qwen3.8-flash"]);
    expect(cfg.model).toBe("qwen3.7-flash");
  });

  it("单个模型时 models 只有一项", () => {
    process.env.AI_PROVIDER = "qwen";
    expect(resolveProvider().models).toEqual(["qwen-plus"]);
  });

  it("DashScope 端点关闭思考模式；其它源不传该参数", () => {
    process.env.AI_PROVIDER = "qwen";
    expect(resolveProvider().disableThinking).toBe(true);
    process.env.AI_PROVIDER = "openai";
    expect(resolveProvider().disableThinking).toBe(false);
    process.env.AI_PROVIDER = "deepseek";
    expect(resolveProvider().disableThinking).toBe(false);
  });

  it("通用 AI_BASE_URL 指向 DashScope 时同样关闭思考", () => {
    process.env.AI_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    expect(resolveProvider().disableThinking).toBe(true);
  });
});

const apiError = (status: number, code?: string) => Object.assign(new Error(`${status} ${code ?? ""}`), { status, code });

describe("isModelUnavailable（换模型能解决的错误）", () => {
  it.each([
    ["免费额度耗尽", apiError(403, "AllocationQuota.FreeTierOnly")],
    ["模型不存在", apiError(404, "model_not_found")],
    ["400 但 code 为 model_not_found", apiError(400, "model_not_found")],
    ["限流", apiError(429)],
    ["服务端错误", apiError(503)],
  ])("%s → 换下一个", (_l, e) => {
    expect(isModelUnavailable(e)).toBe(true);
  });

  it.each([
    ["鉴权失败（换模型也一样）", apiError(401, "invalid_api_key")],
    ["普通 403", apiError(403, "AccessDenied")],
    ["请求参数错", apiError(400, "invalid_parameter")],
    ["超时/网络错（无 status）", new Error("Request timed out")],
  ])("%s → 不换，直接抛", (_l, e) => {
    expect(isModelUnavailable(e)).toBe(false);
  });
});

describe("completeWithFailover（多模型轮换）", () => {
  const MODELS = ["a", "b", "c"];

  it("从起点开始轮换，首个可用即返回", async () => {
    const tried: string[] = [];
    const out = await completeWithFailover(MODELS, 1, async (m) => { tried.push(m); return `ok:${m}`; });
    expect(out).toBe("ok:b");
    expect(tried).toEqual(["b"]);
  });

  it("额度耗尽时依次换下一个，越过末尾回到开头", async () => {
    const tried: string[] = [];
    const out = await completeWithFailover(MODELS, 2, async (m) => {
      tried.push(m);
      if (m !== "b") throw apiError(403, "AllocationQuota.FreeTierOnly");
      return `ok:${m}`;
    });
    expect(out).toBe("ok:b");
    expect(tried).toEqual(["c", "a", "b"]);
  });

  it("不可换模型解决的错误立即抛出，不继续尝试", async () => {
    const tried: string[] = [];
    await expect(
      completeWithFailover(MODELS, 0, async (m) => { tried.push(m); throw apiError(401, "invalid_api_key"); }),
    ).rejects.toMatchObject({ status: 401 });
    expect(tried).toEqual(["a"]);
  });

  it("全部不可用时抛出最后一个错误，每个模型只试一次", async () => {
    const tried: string[] = [];
    await expect(
      completeWithFailover(MODELS, 0, async (m) => { tried.push(m); throw apiError(403, `AllocationQuota.${m}`); }),
    ).rejects.toMatchObject({ code: "AllocationQuota.c" });
    expect(tried).toEqual(["a", "b", "c"]);
  });

  it("起点越界时取模", async () => {
    const tried: string[] = [];
    await completeWithFailover(MODELS, 7, async (m) => { tried.push(m); return m; });
    expect(tried).toEqual(["b"]);
  });
});
