// lib/tools/ai-check.test.ts
//
// C 档的契约：输出只能是固定枚举，任何异常都退回 null（让报告少几条，而不是失败）。
import { describe, it, expect, afterEach } from "vitest";
import { setAiClient, resetAiClient } from "@/lib/ai/client";
import { runAiCheck } from "./ai-check";

const LONG = "Book a free smile assessment with our clinic. ".repeat(20);

/** 注入一个固定返回的假客户端。 */
const fake = (result: unknown) =>
  setAiClient({ completeJson: async () => result as never });

afterEach(() => resetAiClient());

describe("runAiCheck", () => {
  it("透传模型给出的三个判断", async () => {
    fake({ heroClear: "yes", ctaClear: "no", trustSignals: "unknown" });
    expect(await runAiCheck(LONG)).toEqual({
      heroClear: "yes",
      ctaClear: "no",
      trustSignals: "unknown",
    });
  });

  // 模型可能返回枚举外的值（尤其 json_object 模式没有 schema 强制）。
  // 落到 unknown 是安全方向：宁可少一条结论，不可编一条。
  it("把枚举外的值归一成 unknown，而不是原样透出", async () => {
    fake({ heroClear: "excellent", ctaClear: 5, trustSignals: null });
    expect(await runAiCheck(LONG)).toEqual({
      heroClear: "unknown",
      ctaClear: "unknown",
      trustSignals: "unknown",
    });
  });

  it("模型抛错时返回 null，不让整份报告失败", async () => {
    setAiClient({ completeJson: async () => { throw new Error("upstream 503"); } });
    expect(await runAiCheck(LONG)).toBeNull();
  });

  // 骨架屏 / 纯 JS 站抓下来往往只剩几十个字，让模型硬判只会得到噪音。
  it("正文太短时直接跳过，不调用模型", async () => {
    let called = false;
    setAiClient({ completeJson: async () => { called = true; return {} as never; } });
    expect(await runAiCheck("too short")).toBeNull();
    expect(called).toBe(false);
  });
});
