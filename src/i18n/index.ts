/**
 * Public API for the runtime i18n layer.
 *
 * Most components should only need `useT()`:
 *
 *   const t = useT();
 *   <Button>{t('Common.save', '保存')}</Button>
 *
 * Use `useI18n()` when you also need locale metadata or the switcher
 * (e.g. inside the language dropdown in the layout header).
 */

export { clearAllI18nCaches, I18nProvider, useI18n, useT } from './provider';
export { BASE_LOCALE } from './translate';
export type { LocaleSummary, TranslateParams } from './types';

/** Translate function signature – use in non-component factories (e.g. options.ts). */
export type TFn = (
  key: string,
  fallback?: string,
  params?: Record<string, string | number | null | undefined>,
) => string;
