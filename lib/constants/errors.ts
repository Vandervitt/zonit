export const ApiErrors = {
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Not found',
  SLUG_TAKEN: 'slug_taken',
  SITE_NAME_EXISTS: 'Site name already exists.',
  EMAIL_IN_USE: 'Email already in use.',
  FIELDS_REQUIRED: 'All fields are required.',
  QUOTA_EXCEEDED: 'quota_exceeded',
  INVALID_DOMAIN: 'invalid_domain',
  DOMAIN_TAKEN: 'domain_taken',
  VERCEL_API_ERROR: 'vercel_api_error',
} as const;
