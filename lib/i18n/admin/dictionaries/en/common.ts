// 跨页复用的通用文案。只放**真的**在多处出现的词——把一次性文案塞进 common
// 会让它离使用点越来越远，改文案时找不到人。
export const common = {
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  confirm: "Confirm",
  loading: "Loading…",
  empty: "Nothing here yet",
  saved: "Saved",
  saveFailed: "Could not save. Please try again.",
  sessionExpired: "Your session has expired — please sign in again",
  retry: "Retry",
  /** 列表接口失败的错误态。status 为 null 表示非 HTTP 错误（断网等）。 */
  loadError: (label: string, status: number | null) =>
    `Could not load ${label}${status === null ? "" : ` (HTTP ${status})`} — what you see may be incomplete`,
  loadErrorFallbackLabel: "the data",
};
