export enum Routes {
  Home = '/',                       // 营销首页（公开）
  Login = '/login',
  Register = '/register',
  Dashboard = '/admin',             // 租户后台首页
  Domains = '/admin/domains',
  Media = '/admin/media',
  Billing = '/admin/billing',
  Pricing = '/pricing',
  LandingPages = '/admin/landing-pages',
  Settings = '/admin/settings',
  Help = '/admin/help',
  SuperAdmin = '/super-admin',
}

export enum ApiRoutes {
  Domains = '/api/domains',
  Media = '/api/media',
  LandingPages = '/api/landing-pages',
  AiUsage = '/api/ai/usage',
  Analytics = '/api/analytics',
  Templates = '/api/templates',
  Register = '/api/register',
  BillingCheckout = '/api/billing/checkout',
  BillingPortal = '/api/billing/portal',
  AdminTemplates = '/api/admin/templates',
  AdminInvite = '/api/admin/invite',
}

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
