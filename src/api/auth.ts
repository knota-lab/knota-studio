import { get, post, put } from '@/api/client';
import type {
  CaptchaResponse,
  ChangePasswordParams,
  CurrentUserResponse,
  LoginErrorResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileParams,
} from '@/types/api';

export type { CaptchaResponse } from '@/types/api';

export const isLoginErrorResponse = (
  value: unknown,
): value is LoginErrorResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'code' in value && typeof value.code === 'string';
};

export const login = (
  email: string,
  password: string,
  captcha?: { token: string; answer: string },
) => {
  const payload: LoginRequest = {
    email,
    password,
    ...(captcha
      ? { captchaToken: captcha.token, captchaAnswer: captcha.answer }
      : {}),
  };
  return post<LoginResponse>('/auth/login', payload);
};

/** Fetch a fresh stateless captcha challenge. */
export const getCaptcha = () => get<CaptchaResponse>('/auth/captcha');

export const register = (name: string, email: string, password: string) => {
  const payload: RegisterRequest = { name, email, password };
  return post<void>('/auth/register', payload);
};

export const getCurrentUser = () => get<CurrentUserResponse>('/auth/current');

export const updateProfile = (params: UpdateProfileParams) =>
  put<CurrentUserResponse>('/auth/profile', params);

export const changePassword = (params: ChangePasswordParams) =>
  post<void>('/auth/change-password', params);

/**
 * Super-admin-only: clear the login lock + sliding-window failure
 * counter for an account identified by primary email. Idempotent — safe
 * to call on a not-locked account.
 */
export const unlockAccount = (email: string) =>
  post<{ success: boolean }>('/admin/auth/unlock', { email });
