"use client";
// landing-editor/lib/useCompanyInfo.ts
// 编辑器实时预览用：把 footer.companyProfileId 解析成页脚那一行。
//
// 公开页与政策页在服务端解析（lib/company-profiles/resolve.ts），这里是同一件事的
// 客户端版本 —— 用户在页脚面板里换一份主体，右栏预览必须当场跟着变，否则「选了
// 但看不见」等于没这功能。成文规则共用 formatCompanyInfo，不在两处各拼一遍。
import { useEffect, useState } from "react";
import { ApiRoutes } from "@/lib/constants";
import { formatCompanyInfo, type CompanyProfileFields } from "@/lib/company-profiles/format";

type Row = CompanyProfileFields & { id: string };

export function useCompanyInfo(profileId?: string): string | undefined {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(ApiRoutes.CompanyProfiles);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setRows(await res.json());
      } catch {
        setRows([]);
      }
    })();
  }, []);
  if (!profileId) return undefined;
  const row = rows.find((r) => r.id === profileId);
  if (!row) return undefined;
  return formatCompanyInfo(row) || undefined;
}
