import { toast } from 'sonner';

import { getCachedBundle } from '@/i18n/cache';
import { BASE_LOCALE, resolveTranslation } from '@/i18n/translate';

// ─── Types ───────────────────────────────────────────────

const I18N_NAMESPACE = 'CommonError';
const ACTIVE_LOCALE_KEY = 'knota-i18n-active-locale';

/** Read the persisted active locale (synchronous — for error translation). */
const getActiveLocale = (): string => {
  try {
    const raw = window.localStorage.getItem(ACTIVE_LOCALE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && parsed) return parsed;
    }
  } catch {
    // ignore
  }
  return BASE_LOCALE;
};

/**
 * Translate an error `code` via the i18n bundle cache.
 * Convention: backend code `"module.detail"` → i18n key `"CommonError.module.detail"`.
 * Falls back to `fallbackMessage` when no translation exists.
 */
const translateErrorCode = (
  code: string | undefined,
  fallbackMessage: string,
): string => {
  if (!code) return fallbackMessage;
  const i18nKey = `${I18N_NAMESPACE}.${code}`;
  const locale = getActiveLocale();
  const bundles = new Map();
  const active = getCachedBundle(locale, I18N_NAMESPACE);
  if (active) bundles.set(`${locale}::${I18N_NAMESPACE}`, active);
  if (locale !== BASE_LOCALE) {
    const base = getCachedBundle(BASE_LOCALE, I18N_NAMESPACE);
    if (base) bundles.set(`${BASE_LOCALE}::${I18N_NAMESPACE}`, base);
  }
  const resolved = resolveTranslation(
    i18nKey,
    locale,
    bundles,
    fallbackMessage,
  );
  return resolved === i18nKey ? fallbackMessage : resolved;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  code?: string;
  description?: string;

  constructor(
    message: string,
    status: number,
    body: unknown,
    code?: string,
    description?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = code;
    this.description = description;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** If true, errors are NOT auto-handled (no toast) and thrown to caller */
  throwError?: boolean;
  body?: unknown;
  /**
   * Query parameters appended to the URL.
   * Keys with `undefined`, `null`, or empty-string values are silently skipped.
   * Example: `{ page: 1, pageSize: 10, name: 'foo' }` → `?page=1&pageSize=10&name=foo`
   */
  // biome-ignore lint/suspicious/noExplicitAny: must accept typed interfaces which lack implicit index signatures
  params?: Record<string, any>;
}

// ─── Constants ───────────────────────────────────────────

const API_BASE_URL = '/api';
const TOKEN_KEY = 'knota-auth-token';

// ─── Helpers ─────────────────────────────────────────────

const getToken = (): string | null => {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
};

const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const buildUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Append query parameters, skipping undefined / null / empty-string values. */
const buildUrlWithParams = (path: string, params?: Record<string, unknown>) => {
  const base = buildUrl(path);
  if (!params) return base;
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
};

const readError = async (
  response: Response,
): Promise<{
  message: string;
  body: unknown;
  code?: string;
  description?: string;
}> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json();
    const message =
      typeof payload === 'string'
        ? payload
        : (payload?.message ??
          payload?.description ??
          payload?.error ??
          response.statusText);
    const code: string | undefined =
      typeof payload === 'object' && payload !== null
        ? ((payload as Record<string, unknown>).code as string | undefined)
        : undefined;
    const description: string | undefined =
      typeof payload === 'object' && payload !== null
        ? ((payload as Record<string, unknown>).description as
            | string
            | undefined)
        : undefined;
    return { message, body: payload, code, description };
  }

  const text = await response.text();
  return {
    message: text || response.statusText || 'Request failed',
    body: text || null,
  };
};

// ─── Core Request ────────────────────────────────────────

const request = async <T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { throwError = false, body, params, ...init } = options;
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');
  if (body) headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrlWithParams(url, params), {
    ...init,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const {
      message,
      body: errBody,
      code,
      description,
    } = await readError(response);

    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const error = new ApiError(
      message,
      response.status,
      errBody,
      code,
      description,
    );

    if (throwError) throw error;

    toast.error(translateErrorCode(code, message));
    throw error;
  }

  // No content
  if (response.status === 204) return undefined as T;

  const json = await response.json();
  return json as T;
};

// ─── Public API ──────────────────────────────────────────

/**
 * GET request with optional query params.
 * Mirrors the axios `get(url, { params })` convention.
 *
 * ```ts
 * // Simple
 * get<User>('/users/1')
 * // With query params (axios-style)
 * get<User[]>('/users', { params: { page: 1, pageSize: 30 } })
 * ```
 */
export const get = <T>(url: string, options?: RequestOptions) =>
  request<T>(url, { ...options, method: 'GET' });

export const post = <T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
) => request<T>(url, { ...options, method: 'POST', body });

export const put = <T>(url: string, body?: unknown, options?: RequestOptions) =>
  request<T>(url, { ...options, method: 'PUT', body });

export const patch = <T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
) => request<T>(url, { ...options, method: 'PATCH', body });

export const del = <T>(url: string, options?: RequestOptions) =>
  request<T>(url, { ...options, method: 'DELETE' });

export const postMultipart = async <T>(
  url: string,
  formData: FormData,
  options?: RequestOptions,
): Promise<T> => {
  const { throwError = false } = options ?? {};
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(url), {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const { message, body, code, description } = await readError(response);
    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login')
        window.location.href = '/login';
    }
    const error = new ApiError(
      message,
      response.status,
      body,
      code,
      description,
    );
    if (throwError) throw error;
    toast.error(translateErrorCode(code, message));
    throw error;
  }

  return (await response.json()) as T;
};

/** SSE streaming fetch — returns raw Response for caller to read body as ReadableStream */
export const fetchSSE = async (
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> => {
  const headers = new Headers();
  headers.set('Accept', 'text/event-stream');
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(url), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const {
      message,
      body: errBody,
      code,
      description,
    } = await readError(response);
    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login')
        window.location.href = '/login';
    }
    throw new ApiError(message, response.status, errBody, code, description);
  }

  return response;
};

export const getBlob = async (url: string): Promise<Blob> => {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(url), { method: 'GET', headers });

  if (!response.ok) {
    const { message, body, code, description } = await readError(response);
    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login')
        window.location.href = '/login';
    }
    throw new ApiError(message, response.status, body, code, description);
  }

  return response.blob();
};

export { TOKEN_KEY };
