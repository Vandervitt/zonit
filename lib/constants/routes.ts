export enum Routes {
  Home = '/',
  Login = '/login',
  Register = '/register',
  Sites = '/sites',
  Domains = '/domains',
  Media = '/media',
  Billing = '/billing',
  Pricing = '/pricing',
}

export enum ApiRoutes {
  Sites = '/api/sites',
  Domains = '/api/domains',
  Media = '/api/media',
  Templates = '/api/templates',
  Register = '/api/register',
  BillingCheckout = '/api/billing/checkout',
  BillingPortal = '/api/billing/portal',
  AdminTemplates = '/api/admin/templates',
  AdminInvite = '/api/admin/invite',
}

export const apiAdminTemplatePath = (id: string) => `/api/admin/templates/${id}`;
export const apiMediaPath = (id: string) => `/api/media/${id}`;

export const siteEditorPath = (id: string) => `/editor/${id}`;
export const sitePath = (slug: string) => `/site/${slug}`;
export const apiSitePath = (id: string) => `/api/sites/${id}`;
export const apiDomainPath = (id: string) => `/api/domains/${id}`;
export const apiDomainStatusPath = (id: string) => `/api/domains/${id}/status`;
