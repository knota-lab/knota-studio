/**
 * Admin / tenant i18n API surface. Mirrors:
 *   - knota-fold/src/controllers/admin_i18n.rs   (super-admin only)
 *   - knota-fold/src/controllers/tenant_i18n.rs  (current tenant + cross-tenant)
 *   - knota-fold/src/views/i18n.rs               (DTOs)
 *
 * The public bundle endpoints (`/api/public/i18n/locales`, `/api/i18n/bundles/...`)
 * are NOT here — they live in `src/i18n/api.ts` because they need ETag/304
 * handling that bypasses the standard JSON client.
 */

import { del, get, patch, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';

// ── Shared shapes ───────────────────────────────────────────────────────────

export interface LocaleAdmin {
  id: string;
  locale: string;
  label: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocaleParams {
  locale: string;
  label: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export interface UpdateLocaleParams {
  label?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export interface Translation {
  id: string;
  /** `{namespace}.{key}` — convenient for display, never persisted. */
  stableId: string;
  namespace: string;
  key: string;
  locale: string;
  value: string;
  /** `"global" | "tenant"` */
  scope: string;
  tenantId: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationListParams {
  namespace?: string;
  locale?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

// ── Key-grouped listing (vertical-expand UI) ────────────────────────────────

export interface KeyLocaleValue {
  /**
   * Translation row id. Empty string when this cell is an inherited global
   * value with no tenant override row yet (only happens in the tenant
   * listing endpoints).
   */
  id: string;
  value: string;
  updatedAt: string;
  /**
   * `true` when the cell originates from this tenant's override scope.
   * Always `true` in the global listing endpoint.
   */
  isOverride: boolean;
  /**
   * Global value being shadowed by this tenant override. Present only when
   * `isOverride === true` AND a global counterpart exists.
   */
  inheritedValue?: string;
}

export interface KeyEntry {
  namespace: string;
  key: string;
  /** `{namespace}.{key}` — convenience for table rowKey. */
  stableId: string;
  /** Map<locale, value>. Always includes every active locale. */
  byLocale: Record<string, KeyLocaleValue>;
  entryId?: string;
  entryStatus?: string;
  entryDescription?: string;
  entryLastSeenAt?: string;
}

export interface KeyListParams {
  namespace?: string;
  q?: string;
  /** Only return keys where this locale has no (or empty) translation value. */
  emptyLocale?: string;
  page?: number;
  pageSize?: number;
}

export interface UpsertGlobalTranslationParams {
  namespace: string;
  key: string;
  locale: string;
  value: string;
}

export interface UpdateTranslationParams {
  value: string;
}

// ── Entries (catalog) ───────────────────────────────────────────────────────

export interface EntryResponse {
  id: string;
  stableId: string;
  namespace: string;
  key: string;
  description: string | null;
  status: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryLocation {
  id: string;
  filePath: string;
  line: number;
}

// ── Import / export ─────────────────────────────────────────────────────────

export interface ImportEntry {
  namespace: string;
  key: string;
  locale: string;
  value: string;
}

/** `replace` overwrites existing rows; `skip` leaves them. Default is `replace`. */
export type ImportStrategy = 'replace' | 'skip';

export interface GlobalImportRequest {
  scope: 'global';
  entries: ImportEntry[];
  strategy?: ImportStrategy;
}

export interface TenantImportRequest {
  scope: 'tenant';
  entries: ImportEntry[];
  strategy?: ImportStrategy;
}

export interface ImportResponse {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface ExportResponse {
  scope: string;
  generatedAt: string;
  entries: ImportEntry[];
}

export interface ExportQuery {
  scope?: string;
  namespace?: string;
  locale?: string;
}

// ── Namespaces summary (matrix UI) ──────────────────────────────────────────

export interface NamespaceSummary {
  namespace: string;
  keyCount: number;
  localeCount: number;
}

// ── Locales (super-admin) ───────────────────────────────────────────────────

export const listLocales = () => get<LocaleAdmin[]>('/admin/i18n/locales');

export const createLocale = (body: CreateLocaleParams) =>
  post<LocaleAdmin>('/admin/i18n/locales', body);

export const updateLocale = (locale: string, body: UpdateLocaleParams) =>
  patch<LocaleAdmin>(`/admin/i18n/locales/${encodeURIComponent(locale)}`, body);

export const deleteLocale = (locale: string) =>
  del<void>(`/admin/i18n/locales/${encodeURIComponent(locale)}`);

// ── Entries (super-admin) ───────────────────────────────────────────────────

export const listEntryLocations = (id: string) =>
  get<EntryLocation[]>(`/admin/i18n/entries/${id}/locations`);

export const deleteEntry = (id: string) =>
  del<void>(`/admin/i18n/entries/${id}`);

// ── Global translations (super-admin) ───────────────────────────────────────

export const listGlobalKeys = (params: KeyListParams = {}) =>
  get<PaginatedResponse<KeyEntry>>('/admin/i18n/keys', { params });

export const listGlobalNamespaces = () =>
  get<NamespaceSummary[]>('/admin/i18n/namespaces');

export const upsertGlobalTranslation = (body: UpsertGlobalTranslationParams) =>
  post<Translation>('/admin/i18n/translations', body);

export const updateGlobalTranslation = (
  id: string,
  body: UpdateTranslationParams,
) => patch<Translation>(`/admin/i18n/translations/${id}`, body);

export const deleteGlobalTranslation = (id: string) =>
  del<void>(`/admin/i18n/translations/${id}`);

export const importGlobalTranslations = (body: GlobalImportRequest) =>
  post<ImportResponse>('/admin/i18n/translations/import', body);

export const batchUpdateGlobalTranslations = (entries: ImportEntry[]) =>
  post<ImportResponse>('/admin/i18n/translations/batch-update', { entries });

export const exportGlobalTranslations = (query: ExportQuery = {}) =>
  get<ExportResponse>('/admin/i18n/translations/export', { params: query });

// ── User preference (authenticated user) ────────────────────────────────────

export interface I18nMeResponse {
  preferredLocale: string | null;
  defaultLocale: string;
}

export interface UpdateI18nMeRequest {
  preferredLocale: string | null;
}

/** Read current user's locale preference. */
export const getI18nMe = () => get<I18nMeResponse>('/i18n/me');

/** Persist current user's locale preference. */
export const updateI18nMe = (body: UpdateI18nMeRequest) =>
  put<I18nMeResponse>('/i18n/me', body);

// ── Current-tenant overrides (tenant admin) ─────────────────────────────────

export const listCurrentTenantKeys = (params: KeyListParams = {}) =>
  get<PaginatedResponse<KeyEntry>>('/tenant/i18n/keys', { params });

export const listCurrentTenantNamespaces = () =>
  get<NamespaceSummary[]>('/tenant/i18n/namespaces');

export const deleteCurrentTenantOverride = (id: string) =>
  del<void>(`/tenant/i18n/translations/${id}`);

export const deleteCurrentTenantOverrideCell = (params: {
  namespace: string;
  key: string;
  locale: string;
}) => del<{ removed: boolean }>('/tenant/i18n/cell', { params });

export const importCurrentTenantOverrides = (body: TenantImportRequest) =>
  post<ImportResponse>('/tenant/i18n/translations/import', body);

export const batchUpdateTenantOverrides = (entries: ImportEntry[]) =>
  post<ImportResponse>('/tenant/i18n/translations/batch-update', { entries });

export const exportCurrentTenantOverrides = (query: ExportQuery = {}) =>
  get<ExportResponse>('/tenant/i18n/translations/export', { params: query });
