/** /api/health 的返回形状（只关心 status；其余字段由展示层直接读）。 */
export interface HealthProbe {
  status?: string;
}

export type HealthTone = "success" | "error" | "default";

export interface HealthStatusView {
  label: string;
  tone: HealthTone;
}

/**
 * 把健康探测结果映射为展示态：
 * - ok → 健康/success；degraded → 异常/error；
 * - null（网络错误）或无法识别的 status → 未知/default。
 */
export function healthStatusView(input: HealthProbe | null): HealthStatusView {
  if (input?.status === "ok") return { label: "健康", tone: "success" };
  if (input?.status === "degraded") return { label: "异常", tone: "error" };
  return { label: "未知", tone: "default" };
}
