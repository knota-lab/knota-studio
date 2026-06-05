/**
 * Error-code → i18n resolution for backend structured errors.
 *
 * Convention: backend code `"module.detail"` → i18n key `"CommonError.module.detail"`.
 * No explicit mapping needed — the convention is applied automatically.
 *
 * To override a specific code to a different i18n key, add it to `overrides`.
 */

import type { TFn } from '@/i18n';
import { ApiError } from './client';

// Override map for codes that don't follow the "CommonError.{code}" convention.
// Only add entries here when a code needs to map to a DIFFERENT namespace/key.
const overrides: Record<string, string> = {};

const i18nNamespace = 'CommonError';

// Resolve an ApiError (or any error) to a localised human-readable message.
//
// - If the error has a `code`, derive the i18n key via convention or override.
// - `t()` resolves the key; the 2nd arg is the Chinese fallback from the backend.
// - Falls back to `description` → `message` → `String(error)`.
export const getErrorMessage = (error: unknown, t: TFn): string => {
  if (!(error instanceof ApiError) || !error.code) {
    return error instanceof Error ? error.message : String(error);
  }
  const i18nKey = overrides[error.code] ?? `${i18nNamespace}.${error.code}`;
  return t(i18nKey, error.description ?? error.message);
};
