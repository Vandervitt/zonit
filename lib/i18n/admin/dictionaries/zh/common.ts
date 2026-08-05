export const common = {
  save: "保存",
  cancel: "取消",
  delete: "删除",
  edit: "编辑",
  confirm: "确定",
  loading: "加载中…",
  empty: "这里还没有内容",
  saved: "已保存",
  saveFailed: "保存失败，请重试",
  retry: "重试",
  loadError: (label: string, status: number | null) =>
    `${label}加载失败${status === null ? "" : `（HTTP ${status}）`}，当前显示可能不完整`,
  loadErrorFallbackLabel: "数据",
};
