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

class OpenAiClient implements AiClient {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  async completeJson<T = unknown>({ system, user, schema, schemaName }: CompleteJsonArgs): Promise<T> {
    const resp = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, schema: schema as Record<string, unknown>, strict: true },
      },
    });
    const content = resp.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  }
}

/** 取当前 client：注入优先；否则 fake 标志；否则真 OpenAI。 */
export function getAiClient(): AiClient {
  if (override) return override;
  if (process.env.AI_FAKE === "1") return fakeClient;
  return new OpenAiClient();
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
