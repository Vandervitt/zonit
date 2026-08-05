export const media = {
  title: "素材库",
  count: (n: number) => `${n} 个素材`,
  loadErrorLabel: "素材库",
  filter: { all: "全部", image: "图片", video: "视频" },
  empty: "还没有素材",
  emptyHint: "还没有素材，点击 上传素材 开始",

  upload: { button: "上传素材", uploading: "上传中…", failed: "上传失败，请重试" },
  uploadErrors: {
    media_url_invalid: "非法的素材地址",
    media_filename_invalid: "文件名无效",
    media_type_unsupported: "仅支持图片和视频文件",
    media_too_large: (max: string) => `文件超过大小上限（最大 ${max}）`,
    media_upload_auth_failed: "上传授权失败",
    media_unsplash_download_failed: "下载 Unsplash 图片失败",
  },
  deleteConfirm: {
    title: (filename: string) => `确认删除"${filename}"？`,
    ok: "删除",
    cancel: "取消",
  },

  unsplash: {
    open: "从 Unsplash 添加",
    title: "从 Unsplash 添加",
    searchPlaceholder: "搜索 Unsplash 图片（英文更准）",
    searchButton: "搜索",
    searchAria: "搜索 Unsplash 图片",
    notConfigured: "未配置 Unsplash，请联系管理员",
    searchFailed: "搜索失败，请重试",
    prompt: "输入关键词后搜索图片",
    addAria: (author: string) => `添加 Unsplash 图片 by ${author}`,
    adding: "添加中…",
    added: "已添加到素材库",
    addFailed: "添加失败",
  },
};
