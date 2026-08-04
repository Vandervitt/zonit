// lib/company-profiles/input.ts
// 经营主体的入参解析与校验。抽出来是为了 POST 与 PATCH 用同一份规则
// （两处各写一遍必然漂移），也便于单测覆盖边界而不必起 HTTP。
import { ApiErrors } from "@/lib/constants";
import type { CompanyProfileInput } from "./db";

/** 字段长度上限：页脚要展示，过长的值会把页脚撑成一段散文。 */
const MAX = { label: 60, legal_name: 120, address: 200, registration_no: 60, license: 80 } as const;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * 解析并规整入参。legal_name 是唯一必填项：没有法律实体名，这份主体信息对
 * 平台审核毫无意义；地址、注册号、执照按行业与平台要求选填，缺哪项由发布前的
 * 合规提示逐项点出（见 landing-editor/lib/complianceHints.ts）。
 */
export function parseCompanyProfileInput(
  body: unknown,
): { input: CompanyProfileInput } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const legal_name = str(b.legal_name, MAX.legal_name);
  if (!legal_name) return { error: ApiErrors.COMPANY_LEGAL_NAME_REQUIRED };
  return {
    input: {
      // label 留空时回落到实体名：后台列表总得有个可读标题。
      label: str(b.label, MAX.label) || legal_name,
      legal_name,
      address: str(b.address, MAX.address),
      registration_no: str(b.registration_no, MAX.registration_no),
      license: str(b.license, MAX.license),
      is_default: b.is_default === true,
    },
  };
}
