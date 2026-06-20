import OpenAI from "openai";

export interface CompleteJsonArgs {
  system: string;
  user: string;
  schema: unknown;       // JSON Schema
  schemaName: string;
}

export interface AiClient {
  completeJson<T = unknown>(args: CompleteJsonArgs): Promise<T>;
}

let override: AiClient | null = null;

/** 测试/e2e 注入 fake。 */
export function setAiClient(client: AiClient) {
  override = client;
}
export function resetAiClient() {
  override = null;
}

/**
 * 通用 LLM 适配器配置。
 *
 * 适配任意「OpenAI 兼容」端点（同 /chat/completions 协议）：OpenAI、通义 Qwen/DashScope、
 * Gemini 兼容层、DeepSeek、Moonshot、OpenRouter、本地 Ollama/vLLM、Vercel AI Gateway 等。
 *
 * 解析优先级（高 → 低）：
 *   1) 通用 env：AI_BASE_URL / AI_API_KEY / AI_MODEL / AI_JSON_MODE —— 接任意源零代码改动；
 *   2) 预设：AI_PROVIDER=<name> 填好该源的默认 baseURL / model / json 模式；
 *   3) 向后兼容：OPENAI_API_KEY / OPENAI_MODEL / OPENAI_BASE_URL（现网不受影响）。
 *
 * json 模式：OpenAI 支持严格 json_schema；多数兼容源用 json_object（JSON 模式）。
 * 本管线对结构是防御式的（mergeSlots 丢弃未知槽位 + checkDraftCompliance 复核），
 * 不依赖 API 层强制 schema，故 json_object 同样可用。
 */
type JsonMode = "json_schema" | "json_object";

interface ProviderPreset {
  baseURL?: string;
  defaultModel: string;
  jsonMode: JsonMode;
  /** 该预设读取专属 API key 的 env 名（按序回退）。 */
  apiKeyEnvs: string[];
}

const PRESETS: Record<string, ProviderPreset> = {
  openai: {
    defaultModel: "gpt-4o-mini",
    jsonMode: "json_schema",
    apiKeyEnvs: ["OPENAI_API_KEY"],
  },
  qwen: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    jsonMode: "json_object",
    apiKeyEnvs: ["DASHSCOPE_API_KEY", "QWEN_API_KEY"],
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.0-flash",
    jsonMode: "json_object",
    apiKeyEnvs: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  },
  deepseek: {
    baseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    jsonMode: "json_object",
    apiKeyEnvs: ["DEEPSEEK_API_KEY"],
  },
  moonshot: {
    baseURL: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    jsonMode: "json_object",
    apiKeyEnvs: ["MOONSHOT_API_KEY"],
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    jsonMode: "json_object",
    apiKeyEnvs: ["OPENROUTER_API_KEY"],
  },
};

interface ProviderConfig {
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
  strictJsonSchema: boolean;
}

function firstEnv(names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  return undefined;
}

export function resolveProvider(): ProviderConfig {
  const providerId = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  const preset = PRESETS[providerId] ?? PRESETS.openai;
  const isOpenAi = preset === PRESETS.openai;

  const jsonMode = (process.env.AI_JSON_MODE as JsonMode | undefined) ?? preset.jsonMode;

  // 向后兼容的 OPENAI_* 只作用于 openai 预设，避免泄漏到其它源（如 qwen 端点用了 OpenAI key）。
  const legacyBaseURL = isOpenAi ? process.env.OPENAI_BASE_URL : undefined;
  const legacyModel = isOpenAi ? process.env.OPENAI_MODEL : undefined;

  return {
    apiKey: process.env.AI_API_KEY ?? firstEnv(preset.apiKeyEnvs),
    baseURL: process.env.AI_BASE_URL ?? legacyBaseURL ?? preset.baseURL,
    model: process.env.AI_MODEL ?? legacyModel ?? preset.defaultModel,
    strictJsonSchema: jsonMode === "json_schema",
  };
}

class OpenAiCompatibleClient implements AiClient {
  private cfg = resolveProvider();
  private client = new OpenAI({ apiKey: this.cfg.apiKey, baseURL: this.cfg.baseURL });

  async completeJson<T = unknown>({ system, user, schema, schemaName }: CompleteJsonArgs): Promise<T> {
    const resp = await this.client.chat.completions.create({
      model: this.cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: this.cfg.strictJsonSchema
        ? {
            type: "json_schema",
            json_schema: { name: schemaName, schema: schema as Record<string, unknown>, strict: true },
          }
        : { type: "json_object" },
    });
    const content = resp.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  }
}

/** 取当前 client：注入优先；否则 fake 标志；否则按 AI_PROVIDER 选真实源。 */
export function getAiClient(): AiClient {
  if (override) return override;
  if (process.env.AI_FAKE === "1") return fakeClient;
  return new OpenAiCompatibleClient();
}

/** 进程级 fake（e2e 用，由 AI_FAKE=1 启用）：原样回填占位。 */
const fakeClient: AiClient = {
  async completeJson<T>({ user }: CompleteJsonArgs): Promise<T> {
    const ids = [...user.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    if (ids.length > 0) {
      return { slots: ids.map((id) => ({ id, text: `AI 文案 · ${id}` })) } as T;
    }
    return { candidates: ["AI 候选一", "AI 候选二"] } as T;
  },
};
