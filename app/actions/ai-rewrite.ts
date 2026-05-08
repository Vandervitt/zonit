"use server";

import OpenAI from "openai";

const SYSTEM_PROMPT = `你是一个顶级的海外直邮广告（Direct Response）文案大师。

任务：
1. 重写用户提供的 JSON 数据中的所有营销文案（保持原意、提升转化率、增加紧迫感）。

严格约束：
- 返回与输入完全相同结构的 JSON，不增删任何 key。
- 不修改 URL、图片 src、颜色 HEX 代码、icon 字符串标识符（如 "WhatsApp", "Check"）。
- 必须返回合法 JSON object，不包含任何解释文字。`;

export async function rewriteBlockContent(
  blockType: string,
  currentData: unknown,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY 未配置" };
  }

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `模块类型: ${blockType}\n当前数据:\n${JSON.stringify(currentData, null, 2)}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: "AI 返回格式异常，请重试" };
    }

    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return { success: false, error: `重写失败: ${message}` };
  }
}
