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
  Feedback = '/api/feedback',
  AiUsage = '/api/ai/usage',
  Milestones = '/api/milestones',
  Analytics = '/api/analytics',
  Templates = '/api/templates',
  Register = '/api/register',
  OtpSend = '/api/auth/otp/send',
  BillingCheckout = '/api/billing/checkout',
  BillingPortal = '/api/billing/portal',
  BillingChangePlan = '/api/billing/change-plan',
  BillingResume = '/api/billing/resume',
  BillingCredits = '/api/billing/credits',
  AdminTemplates = '/api/admin/templates',
  AdminInvite = '/api/admin/invite',
}

export const templateDetailPath = (id: string) => `/templates/${id}`;

export const apiAdminTemplatePath = (id: string) => `/api/admin/templates/${id}`;
export const apiMediaPath = (id: string) => `/api/media/${id}`;

export const apiDomainPath = (id: string) => `/api/domains/${id}`;
export const apiDomainStatusPath = (id: string) => `/api/domains/${id}/status`;

export const landingEditorPath = (id: string) => `/admin/editor/${id}`;
export const landingPreviewPath = (id: string) => `/admin/editor/${id}/preview`;
export const apiLandingPagesPath = () => `/api/landing-pages`;
export const apiLandingPagePath = (id: string) => `/api/landing-pages/${id}`;
export const apiLandingPublishPath = (id: string) => `/api/landing-pages/${id}/publish`;
export const apiLandingUnpublishPath = (id: string) => `/api/landing-pages/${id}/unpublish`;
export const apiLandingDuplicatePath = (id: string) => `/api/landing-pages/${id}/duplicate`;

export const apiLeadPath = (id: string) => `/api/leads/${id}`;
export const apiLeadsExportPath = () => `/api/leads/export`;

export const apiCapiCredentialsPath = (pageId: string) => `/api/capi-credentials?pageId=${encodeURIComponent(pageId)}`;

export const previewSharePath = (token: string) => `/preview/${token}`;
export const apiLandingPreviewLinkPath = (id: string) => `/api/landing-pages/${id}/preview-link`;
