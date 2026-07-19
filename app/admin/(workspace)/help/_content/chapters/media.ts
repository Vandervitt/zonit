import type { HelpChapterData } from "../types";

export const media: HelpChapterData = {
  slug: "media",
  title: "素材库",
  summary: "图片上传、Unsplash 图库导入与素材使用规范。",
  sections: [
    {
      id: "manage",
      heading: "素材管理",
      blocks: [
        {
          t: "list",
          items: [
            "「素材库」集中管理你上传过的所有图片，编辑器里任何图片位都可以从这里选用，一次上传多处复用。",
            "上传本地图片：点「上传」选择文件。建议使用 JPG / PNG / WebP，单图控制在 1MB 内以保证页面加载速度（加载速度直接影响广告质量分与转化率）。",
            "从 Unsplash 添加：点「从 Unsplash 添加」，搜索英文关键词（如 dental clinic、skincare）挑选导入，图片会存入你的素材库。",
          ],
        },
      ],
    },
    {
      id: "copyright",
      heading: "版权与使用规范",
      blocks: [
        {
          t: "list",
          items: [
            "Unsplash 图片可免费商用，导入时系统自动处理署名要求，无需手动标注。",
            "自行上传的图片请确保拥有使用权：客户案例图（如前后对比、评价头像）需征得当事人同意。",
            "不要上传涉及他人商标、明星肖像或竞品素材的图片——这类素材会触发广告平台审核风险。",
          ],
        },
      ],
    },
  ],
};
