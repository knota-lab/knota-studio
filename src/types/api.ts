export interface LoginRequest {
  email: string;
  password: string;
  /** Opaque JWT issued by `GET /api/auth/captcha`. */
  captchaToken?: string;
  /** User-typed solution to the captcha image. */
  captchaAnswer?: string;
}

export interface CaptchaResponse {
  /** `data:image/jpeg;base64,...` ready for `<img src>`. */
  image: string;
  /** Opaque JWT to echo back as `captchaToken` on login. */
  token: string;
  /** Captcha lifetime in seconds — UI auto-refresh hint. */
  ttlSeconds: number;
}

/**
 * Stable error code returned by `POST /api/auth/login` on failure.
 * The frontend uses this to decide whether to render the captcha block
 * and/or a lock countdown.
 */
export type LoginErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'CAPTCHA_REQUIRED'
  | 'CAPTCHA_INVALID'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_LOCKED';

export interface LoginErrorResponse {
  code: LoginErrorCode;
  message: string;
  /** True when the next attempt MUST carry a captcha. */
  requireCaptcha?: boolean;
  /** Epoch seconds when the account becomes unlocked (ACCOUNT_LOCKED only). */
  unlockAtEpoch?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  name: string;
  isVerified: boolean;
}

export interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  roles: string[];
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  avatarFileId: string | null;
}

export interface UpdateProfileParams {
  name?: string;
  avatarFileId?: string;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

/** System menu (super-admin CRUD) */
export interface SysMenuResponse {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  path: string | null;
  alias: string | null;
  icon: string | null;
  type: string;
  isCache: boolean;
  sortOrder: number;
  remark: string | null;
  status: string;
  version: number;
}

export interface SysMenuTreeResponse extends SysMenuResponse {
  children: SysMenuTreeResponse[];
}

/** Merged menu (tenant admin view + user sidebar) */
export interface MergedMenuTreeResponse {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  path: string | null;
  alias: string | null;
  icon: string | null;
  type: string;
  isCache: boolean;
  sortOrder: number;
  children: MergedMenuTreeResponse[];
}

/** Tenant override request */
export interface UpdateOverrideRequest {
  customName?: string | null;
  customIcon?: string | null;
  customSort?: number | null;
  isHidden?: boolean;
}
