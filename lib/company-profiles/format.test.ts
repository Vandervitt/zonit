import { describe, it, expect } from "vitest";
import { formatCompanyInfo } from "./format";
import { parseCompanyProfileInput } from "./input";
import { ApiErrors } from "@/lib/constants";

const full = {
  legal_name: "Acme Aesthetics Ltd",
  address: "12 King Street, London W1",
  registration_no: "12345678",
  license: "HCA-2291",
};

describe("formatCompanyInfo", () => {
  it("四项齐全时按固定顺序成文", () => {
    expect(formatCompanyInfo(full)).toBe(
      "Acme Aesthetics Ltd · 12 King Street, London W1 · Company No. 12345678 · License HCA-2291",
    );
  });

  it("空字段整段省略，不留半截信息", () => {
    expect(formatCompanyInfo({ ...full, registration_no: "", license: "" })).toBe(
      "Acme Aesthetics Ltd · 12 King Street, London W1",
    );
  });

  it("只有实体名也成立", () => {
    expect(formatCompanyInfo({ legal_name: "Acme Ltd", address: "", registration_no: "", license: "" }))
      .toBe("Acme Ltd");
  });

  it("全空得空串（调用方据此不渲染这一行）", () => {
    expect(formatCompanyInfo({ legal_name: "", address: "", registration_no: "", license: "" })).toBe("");
  });
});

describe("parseCompanyProfileInput", () => {
  it("legal_name 是唯一必填项", () => {
    const r = parseCompanyProfileInput({ address: "x" });
    expect(r).toEqual({ error: ApiErrors.COMPANY_LEGAL_NAME_REQUIRED });
  });

  it("只有空白的实体名同样不通过", () => {
    expect(parseCompanyProfileInput({ legal_name: "   " }))
      .toEqual({ error: ApiErrors.COMPANY_LEGAL_NAME_REQUIRED });
  });

  it("label 留空回落到实体名（后台列表总得有标题）", () => {
    const r = parseCompanyProfileInput({ legal_name: "Acme Ltd" });
    expect("input" in r && r.input.label).toBe("Acme Ltd");
  });

  it("去空白、非字符串按空处理、is_default 只认布尔真", () => {
    const r = parseCompanyProfileInput({
      legal_name: "  Acme Ltd ",
      address: 42,
      registration_no: null,
      is_default: "true",
    });
    expect("input" in r && r.input).toMatchObject({
      legal_name: "Acme Ltd",
      address: "",
      registration_no: "",
      is_default: false,
    });
  });

  it("超长字段被截断，不让页脚被撑成一段散文", () => {
    const r = parseCompanyProfileInput({ legal_name: "A".repeat(500) });
    expect("input" in r && r.input.legal_name.length).toBe(120);
  });
});
