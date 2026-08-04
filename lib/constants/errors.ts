export const ApiErrors = {
  UNAUTHORIZED: 'Unauthorized',
  SESSION_STALE: 'session_stale',
  NOT_FOUND: 'Not found',
  SLUG_TAKEN: 'slug_taken',
  NAME_TAKEN: 'name_taken',
  SITE_NAME_EXISTS: 'Site name already exists.',
  EMAIL_NOT_SUPPORTED: 'Only Gmail addresses are supported.',
  EMAIL_INVALID: 'Please enter a valid email address.',
  OTP_INVALID: 'Invalid or expired verification code.',
  FIELDS_REQUIRED: 'All fields are required.',
  QUOTA_EXCEEDED: 'quota_exceeded',
  LIMIT_EXCEEDED: 'limit_exceeded',
  INVALID_DOMAIN: 'invalid_domain',
  DOMAIN_TLD_BLOCKED: 'domain_tld_blocked',
  DOMAIN_TAKEN: 'domain_taken',
  /** 平台子域根域未配置，或连续重试后仍未分配到可用 slug。 */
  SUBDOMAIN_UNAVAILABLE: 'subdomain_unavailable',
  /** 用户试图手动添加平台自有域名后缀（只能经平台分配入口获得）。 */
  DOMAIN_RESERVED_SUFFIX: 'domain_reserved_suffix',
  VERCEL_API_ERROR: 'vercel_api_error',
  VALIDATION_FAILED: 'validation_failed',
  DOMAIN_REQUIRED: 'domain_required',
  DOMAIN_NOT_VERIFIED: 'domain_not_verified',
  PATH_INVALID: 'path_invalid',
  PATH_RESERVED: 'path_reserved',
  PUBLISH_QUOTA_EXCEEDED: 'publish_quota_exceeded',
  BAD_REQUEST: 'bad_request',
  /** 当前套餐不含该能力（如服务端回传属高级追踪）。 */
  PLAN_REQUIRED: 'plan_required',
  AI_QUOTA_EXHAUSTED: 'ai_quota_exhausted',
  AI_GENERATION_FAILED: 'ai_generation_failed',
  /** 经营主体缺法律实体名（唯一必填项）。 */
  COMPANY_LEGAL_NAME_REQUIRED: 'company_legal_name_required',
  /** 该经营主体仍被落地页引用，删除会让那些页的页脚当场少掉公司信息。 */
  COMPANY_PROFILE_IN_USE: 'company_profile_in_use',
} as const;
