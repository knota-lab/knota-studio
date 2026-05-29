/**
 * Shared types for the runtime i18n layer.
 *
 * Backend contract reminder (see system-design/国际化.md §6):
 * - `LocaleSummary` is the row shape returned by `GET /api/public/i18n/locales`.
 * - `BundleResponse` is the body of `GET /api/i18n/bundles/{namespace}/{locale}`.
 *   `entries` is a flat `{ key: value }` map; the bundle key on the client side
 *   is `${namespace}.${key}` to avoid cross-namespace collisions.
 */

export interface LocaleSummary {
  /** BCP-47 tag, e.g. `zh-CN`, `en-US`. */
  locale: string;
  /** Display label in the locale's own language (e.g. "简体中文"). */
  label: string;
  /** Whether this locale is selectable. Disabled locales hidden from picker. */
  isEnabled: boolean;
  /** Sort order (ascending). */
  sortOrder: number;
}

export interface BundleResponse {
  namespace: string;
  locale: string;
  /** Combined ETag covering both global + tenant revisions. */
  etag: string;
  /** Flat key→value map. Keys do NOT include the namespace prefix. */
  entries: Record<string, string>;
}

/**
 * Cached bundle as we keep it in memory + localStorage.
 * Stored separately from `BundleResponse` so that we can persist hits without
 * re-shipping the full DTO.
 */
export interface CachedBundle {
  namespace: string;
  locale: string;
  etag: string;
  entries: Record<string, string>;
  /** Wall-clock ms when this entry was last validated against the server. */
  fetchedAt: number;
}

/** Shape of `t()`'s second arg. Values are coerced to string at substitution. */
export type TranslateParams = Record<
  string,
  string | number | null | undefined
>;
