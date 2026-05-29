/**
 * Low-level i18n fetchers. We bypass `@/api/client` for bundle requests
 * because the client wrapper neither exposes response headers (needed for
 * ETag) nor surfaces 304s (the JSON parse path would throw). Token handling
 * mirrors `client.ts` so the auth contract stays identical.
 */

import { ApiError, TOKEN_KEY } from '@/api/client';
import type { BundleResponse, CachedBundle, LocaleSummary } from './types';

const API_BASE = '/api';

export const readToken = (): string | null => {
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string;
  } catch {
    return raw;
  }
};

const buildHeaders = (extra?: HeadersInit): Headers => {
  const headers = new Headers(extra);
  headers.set('Accept', 'application/json');
  const token = readToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const handleAuthFailure = (status: number): void => {
  if (status === 401) {
    window.localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
};

/** GET /api/public/i18n/locales — every authenticated user (whitelisted in Casbin). */
export const fetchLocales = async (): Promise<LocaleSummary[]> => {
  const response = await fetch(`${API_BASE}/public/i18n/locales`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  if (!response.ok) {
    handleAuthFailure(response.status);
    throw new ApiError(
      response.statusText || 'Failed to load locales',
      response.status,
      null,
    );
  }
  return (await response.json()) as LocaleSummary[];
};

/**
 * Result of a bundle fetch. `notModified=true` means the server returned 304
 * and the caller should keep its cached entries.
 */
export type BundleFetchResult =
  | { notModified: true; etag: string | null }
  | { notModified: false; bundle: BundleResponse };

/**
 * Fetch a bundle — automatically picks the public or authenticated endpoint.
 *
 * When no JWT is present (e.g. login page) the request goes to
 * `/api/public/i18n/bundles/…` which the backend serves without auth but
 * only for whitelisted namespaces (Login, etc.).
 *
 * When a JWT exists the request goes to the standard
 * `/api/i18n/bundles/…` path so the server can apply tenant-scoping.
 */
export const fetchBundle = async (
  namespace: string,
  locale: string,
  cached?: CachedBundle | null,
): Promise<BundleFetchResult> => {
  const token = readToken();
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (cached?.etag) {
    headers.set('If-None-Match', cached.etag);
  }

  const prefix = token
    ? `${API_BASE}/i18n/bundles`
    : `${API_BASE}/public/i18n/bundles`;
  const url = `${prefix}/${encodeURIComponent(namespace)}/${encodeURIComponent(locale)}`;
  const response = await fetch(url, { method: 'GET', headers });

  if (response.status === 304) {
    return { notModified: true, etag: response.headers.get('ETag') };
  }

  if (!response.ok) {
    handleAuthFailure(response.status);
    throw new ApiError(
      response.statusText || `Failed to load bundle ${namespace}/${locale}`,
      response.status,
      null,
    );
  }

  const bundle = (await response.json()) as BundleResponse;
  return { notModified: false, bundle };
};
