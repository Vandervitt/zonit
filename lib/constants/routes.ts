export enum Routes {
  Home = '/',                       // 营销首页（公开）
  Login = '/login',
  Register = '/register',
  Dashboard = '/admin',             // 租户后台首页
  Domains = '/admin/domains',
  Media = '/admin/media',
  Analytics = '/admin/analytics',
  Billing = '/admin/billing',
  Pricing = '/pricing',
  AntiBan = '/anti-ban',            // 反同质化叙事页（公开）
  Templates = '/templates',         // 公开模板画廊（SEO 获客页）
  Guides = '/guides',               // 公开获客指南（SEO 内容营销）
  PageCheck = '/tools/landing-page-check', // 落地页自检器（公开工具，匿名可用）
  Privacy = '/privacy',             // 隐私政策（公开）
  Terms = '/terms',                 // 服务条款（公开）
  LandingPages = '/admin/landing-pages',
  Leads = '/admin/leads',
  Settings = '/admin/settings',
  Help = '/admin/help',
  SuperAdmin = '/super-admin',
}

export enum ApiRoutes {
  Domains = '/api/domains',
  Media = '/api/media',
  MediaBlobToken = '/api/media/blob-token',
  MediaUnsplash = '/api/media/unsplash',
  UnsplashSearch = '/api/unsplash/search',
  LandingPages = '/api/landing-pages',
  Leads = '/api/leads',
  /** 本租户用过的线索标签（筛选器候选）。 */
  LeadTags = '/api/leads/tags',
  Feedback = '/api/feedback',
  AiUsage = '/api/ai/usage',
  Milestones = '/api/milestones',
  Analytics = '/api/analytics',
  /** 多页横向对比（哪张在跑、哪张在空转）。 */
  AnalyticsPages = '/api/analytics/pages',
  Templates = '/api/templates',
  OtpSend = '/api/auth/otp/send',
  BillingCheckout = '/api/billing/checkout',
  BillingPortal = '/api/billing/portal',
  BillingChangePlan = '/api/billing/change-plan',
  BillingResume = '/api/billing/resume',
  BillingCredits = '/api/billing/credits',
  FxUsdCny = '/api/fx/usd-cny',
  CompanyProfiles = '/api/company-profiles',
  /** 账号级 CAPI 凭据（页级凭据仍走 apiCapiCredentialsPath）。 */
  CapiAccountCredentials = '/api/capi-credentials/account',
  CapiHealth = '/api/capi/health',
  /** 已发布页的骨架重复读数（判重风险依据）。 */
  AntiBanSimilarity = '/api/antiban/similarity',
  AdminTemplates = '/api/admin/templates',
  AdminInvite = '/api/admin/invite',
}

export const templateDetailPath = (id: string) => `/templates/${id}`;
// 行业中间层。静态段 `industry` 比 /templates/[slug] 更具体，Next 优先匹配它，
// 两者不会撞车（[slug] 的 dynamicParams=false，slug="industry" 本就 404）。
export const templateIndustryPath = (category: string) => `/templates/industry/${category}`;
export const guideDetailPath = (slug: string) => `/guides/${slug}`;
/** 自检报告页。id 不可猜测，页面 noindex——报告是他人页面的检查结果。 */
export const pageCheckReportPath = (id: string) => `/tools/landing-page-check/r/${id}`;

export const apiMediaPath = (id: string) => `/api/media/${id}`;

export const apiDomainPath = (id: string) => `/api/domains/${id}`;
export const apiDomainStatusPath = (id: string) => `/api/domains/${id}/status`;

export const landingEditorPath = (id: string) => `/admin/editor/${id}`;
export const landingPreviewPath = (id: string) => `/admin/editor/${id}/preview`;
export const apiLandingPagePath = (id: string) => `/api/landing-pages/${id}`;
export const apiLandingPublishPath = (id: string) => `/api/landing-pages/${id}/publish`;
export const apiLandingUnpublishPath = (id: string) => `/api/landing-pages/${id}/unpublish`;
export const apiLandingDuplicatePath = (id: string) => `/api/landing-pages/${id}/duplicate`;
/** 对自己已发布的页跑一次自检（复用公开自检器的检查逻辑）。 */
export const apiLandingCheckPath = (id: string) => `/api/landing-pages/${id}/check`;

export const apiLeadPath = (id: string) => `/api/leads/${id}`;
/** CSV 导出。带上列表当前的筛选，导出结果与所见一致。 */
export const apiLeadsExportPath = (
  filter: { pageId?: string; unreadOnly?: boolean; tag?: string; archived?: boolean } = {},
) => {
  const q = new URLSearchParams();
  if (filter.pageId) q.set("pageId", filter.pageId);
  if (filter.unreadOnly) q.set("unreadOnly", "1");
  if (filter.tag) q.set("tag", filter.tag);
  if (filter.archived) q.set("archived", "1");
  const qs = q.toString();
  return `/api/leads/export${qs ? `?${qs}` : ""}`;
};

export const apiCapiCredentialsPath = (pageId: string) => `/api/capi-credentials?pageId=${encodeURIComponent(pageId)}`;

export const previewSharePath = (token: string) => `/preview/${token}`;
export const apiLandingPreviewLinkPath = (id: string) => `/api/landing-pages/${id}/preview-link`;
