/**
 * Pure translation primitives. No React, no I/O — just key resolution and
 * `{{var}}` substitution. Kept separate from the provider so it's trivially
 * unit-testable and reusable from non-component code (e.g. error boundaries).
 */

import type { CachedBundle, TranslateParams } from './types';

/** Hard-coded base locale matching backend `BASE_LOCALE` constant. */
export const BASE_LOCALE = 'zh-CN';

/**
 * Substitute `{{var}}` placeholders. Unknown variables stay as-is (literal
 * `{{var}}` text), which makes missing-data bugs visible in the UI rather
 * than silently disappearing.
 */
export const interpolate = (
  template: string,
  params?: TranslateParams,
): string => {
  if (!params) return template;
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (full, name: string) => {
    const v = params[name];
    if (v === undefined || v === null) return full;
    return String(v);
  });
};

/**
 * Resolve a translation by `${namespace}.${key}`.
 *
 * Lookup order per design doc §4:
 * 1. Active-locale bundle for the matching namespace.
 * 2. Base-locale (zh-CN) bundle for the matching namespace.
 * 3. The raw key string (so missing translations are visible in dev).
 *
 * `bundles` is keyed by `${locale}::${namespace}` to share shape with the
 * cache module without forcing the caller to depend on it.
 */
export const resolveTranslation = (
  fullKey: string,
  activeLocale: string,
  bundles: Map<string, CachedBundle>,
  fallbackOrParams?: string | TranslateParams,
  params?: TranslateParams,
): string => {
  const actualParams =
    typeof fallbackOrParams === 'object' ? fallbackOrParams : params;
  const fallback =
    typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
  const dotIdx = fullKey.indexOf('.');
  if (dotIdx <= 0 || dotIdx === fullKey.length - 1) {
    // Malformed key — return as-is so the caller sees the bug.
    return fallback ? interpolate(fallback, actualParams) : fullKey;
  }
  const namespace = fullKey.slice(0, dotIdx);
  const subKey = fullKey.slice(dotIdx + 1);

  const active = bundles.get(`${activeLocale}::${namespace}`);
  const activeHit = active?.entries[subKey];
  if (activeHit !== undefined) return interpolate(activeHit, actualParams);

  if (activeLocale !== BASE_LOCALE) {
    const base = bundles.get(`${BASE_LOCALE}::${namespace}`);
    const baseHit = base?.entries[subKey];
    if (baseHit !== undefined) return interpolate(baseHit, actualParams);
  }

  return fallback ? interpolate(fallback, actualParams) : fullKey;
};

/** Extract namespace from a full key. Returns `null` if malformed. */
export const namespaceOf = (fullKey: string): string | null => {
  const idx = fullKey.indexOf('.');
  if (idx <= 0) return null;
  return fullKey.slice(0, idx);
};
