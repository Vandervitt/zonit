import OpenAI from "openai";
import * as Sentry from "@sentry/nextjs";

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
 *      AI_MODEL 可写逗号分隔的多个模型：每次请求从随机位置轮换起步，某个模型额度耗尽/不可用时
 *      自动换下一个（见 completeWithFailover）——多个免费额度可以叠着用，单个耗尽不再整站停摆；
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
  /** 轮换候选的第一个；保留单值字段供日志与既有调用方使用。 */
  model: string;
  /** 轮换候选（AI_MODEL 逗号分隔）。至少一项。 */
  models: string[];
  strictJsonSchema: boolean;
  /**
   * DashScope 上的 qwen3.x / deepseek-v4 默认开思考模式：实测整页生成 127s vs 关掉 44s，
   * 文案质量无明显差别。Vercel iad1 → 国内 DashScope 本就慢，再叠思考 + 合规重试会顶到
   * 函数 300s 上限，故一律关闭。enable_thinking 是 DashScope 扩展参数，别的源不传。
   */
  disableThinking: boolean;
}

const DASHSCOPE_HOST = "dashscope.aliyuncs.com";

function parseModels(raw: string): string[] {
  return raw.split(",").map((m) => m.trim()).filter(Boolean);
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

  const baseURL = process.env.AI_BASE_URL ?? legacyBaseURL ?? preset.baseURL;
  const parsed = parseModels(process.env.AI_MODEL ?? legacyModel ?? "");
  const models = parsed.length > 0 ? parsed : [preset.defaultModel];

  return {
    apiKey: process.env.AI_API_KEY ?? firstEnv(preset.apiKeyEnvs),
    baseURL,
    model: models[0],
    models,
    strictJsonSchema: jsonMode === "json_schema",
    disableThinking: Boolean(baseURL?.includes(DASHSCOPE_HOST)),
  };
}

/**
 * 换一个模型能解决的错误：额度耗尽、模型不存在/下线、限流、服务端故障。
 * 鉴权失败、参数错误换模型也一样，超时与网络错若再换一个会把总耗时叠过函数上限——都不换。
 */
export function isModelUnavailable(e: unknown): boolean {
  const { status, code } = (e ?? {}) as { status?: number; code?: string | null };
  if (typeof status !== "number") return false;
  if (code === "model_not_found") return true;
  if (status === 403) return typeof code === "string" && code.startsWith("AllocationQuota");
  return status === 404 || status === 429 || status >= 500;
}

/** 从 start 起按序轮换候选模型，遇到「换模型能解决」的错误才换下一个；全部不可用时抛最后一个错误。 */
export async function completeWithFailover<T>(
  models: string[],
  start: number,
  call: (model: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const model = models[(start + i) % models.length];
    try {
      return await call(model);
    } catch (e) {
      if (!isModelUnavailable(e)) throw e;
      lastError = e;
      console.warn(`[ai-client] model ${model} unavailable, trying next:`, (e as Error).message);
    }
  }
  throw lastError;
}

class OpenAiCompatibleClient implements AiClient {
  private cfg = resolveProvider();
  private client = new OpenAI({ apiKey: this.cfg.apiKey, baseURL: this.cfg.baseURL });

  async completeJson<T = unknown>({ system, user, schema, schemaName }: CompleteJsonArgs): Promise<T> {
    // 耗时埋点：生产上「AI 一键成页」曾偶发超时/失败，本地永远复现不出来，
    // 排查确认是 Vercel Function（iad1）打国内 DashScope 单次就要 60+ 秒（见 PR #196）。
    // 留着这条埋点——那条延迟不是一次性的，以后哪个 provider/region 变慢了还得靠它发现。
    const startedAt = Date.now();
    const provider = this.cfg.baseURL ?? "openai";
    const { models } = this.cfg;
    let usedModel = models[0];
    try {
      // 随机起点：多个免费额度被均匀消耗，而不是永远先把第一个打穿。
      const start = Math.floor(Math.random() * models.length);
      const resp = await completeWithFailover(models, start, (model) => {
        usedModel = model;
        return this.client.chat.completions.create({
          model,
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
          ...(this.cfg.disableThinking ? { enable_thinking: false } : {}),
        } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);
      });
      const durationMs = Date.now() - startedAt;
      console.log(`[ai-client] completeJson(${schemaName}) ok in ${durationMs}ms, provider=${provider}, model=${usedModel}`);
      // 只留面包屑，不单独报事件——成功没有必要产生 Sentry 告警噪音，
      // 但一旦后面真出错了，这条能告诉你「失败前那次调用花了多久」。
      Sentry.addBreadcrumb({
        category: "ai-client",
        message: `completeJson(${schemaName}) ok`,
        level: "info",
        data: { durationMs, provider, model: usedModel },
      });
      const content = resp.choices[0]?.message?.content ?? "{}";
      return JSON.parse(content) as T;
    } catch (e) {
      const durationMs = Date.now() - startedAt;
      console.error(`[ai-client] completeJson(${schemaName}) FAILED after ${durationMs}ms, provider=${provider}, model=${usedModel}:`, e);
      Sentry.captureException(e, {
        tags: { route: "ai-client", schemaName, provider },
        extra: { durationMs, model: usedModel, candidates: models },
      });
      throw e;
    }
  }
}

/**
 * 当前环境是否配得出一个能用的模型源。
 *
 * 给「可选的 AI 增强」路径用（如落地页自检器的 C 档）：没配就直接跳过，
 * 免得每次都先记一笔预算、再让调用必然失败——计数器会被没花过的钱污染。
 * 注入的 fake 与 AI_FAKE 都算「配好了」，否则测试与 e2e 走不到这条路径。
 */
export function isAiConfigured(): boolean {
  if (override || process.env.AI_FAKE === "1") return true;
  return Boolean(resolveProvider().apiKey);
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
