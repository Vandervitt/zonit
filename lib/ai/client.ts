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
 * provider 解析：默认 OpenAI；AI_PROVIDER=qwen 走通义千问 DashScope 兼容模式。
 * - OpenAI 支持严格 json_schema 结构化输出；
 * - Qwen 兼容端点用 json_object（JSON 模式）。本管线对结构是防御式的
 *   （mergeSlots 丢弃未知槽位 + checkDraftCompliance 复核），不依赖 API 层强制 schema。
 */
type ProviderId = "openai" | "qwen";

interface ProviderConfig {
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
  strictJsonSchema: boolean;
}

export function resolveProvider(): ProviderConfig {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase() as ProviderId;
  if (provider === "qwen") {
    return {
      apiKey: process.env.DASHSCOPE_API_KEY ?? process.env.QWEN_API_KEY,
      baseURL:
        process.env.QWEN_BASE_URL ??
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: process.env.QWEN_MODEL ?? "qwen-plus",
      strictJsonSchema: false,
    };
  }
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // 可选；未设时走官方端点
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    strictJsonSchema: true,
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
