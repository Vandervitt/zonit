export enum Routes {
  Home = '/',
  Login = '/login',
  Register = '/register',
  Sites = '/sites',
  Domains = '/domains',
  Billing = '/billing',
  Pricing = '/pricing',
}

export enum ApiRoutes {
  Sites = '/api/sites',
  Domains = '/api/domains',
  Register = '/api/register',
}

export const siteEditorPath = (id: string) => `/editor/${id}`;
export const sitePath = (slug: string) => `/site/${slug}`;
export const apiSitePath = (id: string) => `/api/sites/${id}`;
export const apiDomainPath = (id: string) => `/api/domains/${id}`;
export const apiDomainStatusPath = (id: string) => `/api/domains/${id}/status`;
