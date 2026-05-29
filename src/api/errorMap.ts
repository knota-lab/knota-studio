/**
 * Error-code → i18n resolution for backend structured errors.
 *
 * Convention: backend code `"module.detail"` → i18n key `"CommonError.module.detail"`.
 * No explicit mapping needed — the convention is applied automatically.
 *
 * To override a specific code to a different i18n key, add it to `OVERRIDES`.
 */

import type { TFn } from '@/i18n';
import { ApiError } from './client';

// Override map for codes that don't follow the "CommonError.{code}" convention.
// Only add entries here when a code needs to map to a DIFFERENT namespace/key.
const OVERRIDES: Record<string, string> = {};

const I18N_NAMESPACE = 'CommonError';

// Resolve an ApiError (or any error) to a localised human-readable message.
//
// - If the error has a `code`, derive the i18n key via convention or override.
// - `t()` resolves the key; the 2nd arg is the Chinese fallback from the backend.
// - Falls back to `description` → `message` → `String(error)`.
export const getErrorMessage = (error: unknown, t: TFn): string => {
  if (!(error instanceof ApiError) || !error.code) {
    return error instanceof Error ? error.message : String(error);
  }
  const i18nKey = OVERRIDES[error.code] ?? `${I18N_NAMESPACE}.${error.code}`;
  return t(i18nKey, error.description ?? error.message);
};
