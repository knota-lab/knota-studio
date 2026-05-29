/**
 * Two-tier bundle cache: in-memory map (hot path) backed by localStorage
 * (survives full reloads). LocalStorage is best-effort — quota errors are
 * swallowed because the in-memory copy is always authoritative for the
 * current session.
 */

import type { CachedBundle } from './types';

const STORAGE_PREFIX = 'knota-i18n-bundle::';

const memoryCache = new Map<string, CachedBundle>();

const cacheKey = (locale: string, namespace: string): string =>
  `${locale}::${namespace}`;

const storageKey = (locale: string, namespace: string): string =>
  `${STORAGE_PREFIX}${cacheKey(locale, namespace)}`;

const readFromStorage = (
  locale: string,
  namespace: string,
): CachedBundle | null => {
  const raw = window.localStorage.getItem(storageKey(locale, namespace));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedBundle;
    if (
      parsed &&
      typeof parsed.etag === 'string' &&
      parsed.entries &&
      typeof parsed.entries === 'object'
    ) {
      return parsed;
    }
    return null;
  } catch {
    // Corrupt entry — drop it silently so the next fetch overwrites.
    return null;
  }
};

const writeToStorage = (bundle: CachedBundle): void => {
  try {
    window.localStorage.setItem(
      storageKey(bundle.locale, bundle.namespace),
      JSON.stringify(bundle),
    );
  } catch {
    // Quota exceeded or storage disabled — non-fatal.
  }
};

/** Look up cached bundle (memory first, then localStorage hydration). */
export const getCachedBundle = (
  locale: string,
  namespace: string,
): CachedBundle | null => {
  const key = cacheKey(locale, namespace);
  const hit = memoryCache.get(key);
  if (hit) return hit;

  const fromStorage = readFromStorage(locale, namespace);
  if (fromStorage) {
    memoryCache.set(key, fromStorage);
  }
  return fromStorage;
};

/** Persist a freshly fetched bundle to both memory and localStorage. */
export const setCachedBundle = (bundle: CachedBundle): void => {
  memoryCache.set(cacheKey(bundle.locale, bundle.namespace), bundle);
  writeToStorage(bundle);
};

/**
 * Drop every cached bundle for `locale`. Used on language switch and on
 * tenant change so we never serve stale entries from a different scope.
 */
export const invalidateLocale = (locale: string): void => {
  const prefix = `${locale}::`;
  const keys = Array.from(memoryCache.keys());
  for (const key of keys) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  const storagePrefix = `${STORAGE_PREFIX}${prefix}`;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(storagePrefix)) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // ignore storage errors
  }
};

/** Drop every cached bundle (used on logout / tenant change). */
export const invalidateAll = (): void => {
  memoryCache.clear();
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
};
