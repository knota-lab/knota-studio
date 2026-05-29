/**
 * `<I18nProvider>` and `useT()` — the runtime entry points consumed by app
 * code.
 *
 * Design highlights:
 * - Locale list loads once on mount (whitelisted endpoint).
 * - Active locale persists in localStorage; default is the first enabled
 *   locale returned by the backend, falling back to the base locale.
 * - Bundles load lazily: the first `t()` call referencing a namespace
 *   triggers a fetch. Subsequent calls in the same render cycle are
 *   coalesced via the in-flight promise map.
 * - On locale switch we invalidate the previous locale's cache (memory +
 *   storage) and re-fetch every namespace that was already loaded so that
 *   visible UI text updates without a page reload.
 * - Render-time bundle loads use `useSyncExternalStore` to avoid the React 19
 *   "set state during render" warning while still letting `t()` be called
 *   from anywhere.
 */

import { useLocalStorageState } from 'ahooks';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { getI18nMe, updateI18nMe } from '@/api/i18n-admin';
import { fetchBundle, fetchLocales, readToken } from './api';
import {
  getCachedBundle,
  invalidateAll,
  invalidateLocale,
  setCachedBundle,
} from './cache';
import { BASE_LOCALE, resolveTranslation } from './translate';
import type { CachedBundle, LocaleSummary, TranslateParams } from './types';

const ACTIVE_LOCALE_KEY = 'knota-i18n-active-locale';

interface I18nContextValue {
  /** Currently selected locale tag, e.g. `zh-CN`. */
  locale: string;
  /** All locales returned by the backend (enabled + disabled). */
  locales: LocaleSummary[];
  /** Switch to another locale and re-fetch all loaded namespaces. */
  setLocale: (next: string) => void;
  /** Initial locale + namespace bootstrap state. */
  ready: boolean;
  /** True while `setLocale` is fetching new bundles. */
  switching: boolean;
  /**
   * Translate `${namespace}.${key}` for the active locale, with optional
   * `{{var}}` substitutions. Triggers a lazy bundle fetch on cache miss.
   */
  t: (
    key: string,
    fallbackOrParams?: string | TranslateParams,
    params?: TranslateParams,
  ) => string;
  /**
   * Eagerly preload bundles. Useful for layouts that know upfront which
   * namespaces a route will need.
   */
  preload: (namespaces: string[]) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface BundleStoreSnapshot {
  bundles: Map<string, CachedBundle>;
  /** Monotonic counter; bumped on every cache write to drive re-renders. */
  version: number;
}

const makeStoreKey = (locale: string, namespace: string) =>
  `${locale}::${namespace}`;

interface I18nProviderProps {
  children: ReactNode;
  /**
   * Namespaces to preload on first render. Bundles fetch in parallel; the
   * provider does NOT block rendering on them — `t()` returns the raw key
   * until the bundle resolves, then re-renders.
   */
  initialNamespaces?: string[];
}

export const I18nProvider = ({
  children,
  initialNamespaces,
}: I18nProviderProps) => {
  const [locales, setLocales] = useState<LocaleSummary[]>([]);
  const [ready, setReady] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [storedLocale, setStoredLocale] = useLocalStorageState<
    string | undefined
  >(ACTIVE_LOCALE_KEY);
  const [activeLocale, setActiveLocale] = useState<string>(BASE_LOCALE);

  const storeRef = useRef<BundleStoreSnapshot>({
    bundles: new Map(),
    version: 0,
  });
  const listenersRef = useRef<Set<() => void>>(new Set());
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const loadedNamespacesRef = useRef<Set<string>>(new Set());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);
  const getSnapshot = useCallback(() => storeRef.current, []);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const notify = useCallback(() => {
    storeRef.current = {
      bundles: storeRef.current.bundles,
      version: storeRef.current.version + 1,
    };
    for (const listener of listenersRef.current) listener();
  }, []);

  const writeBundleToStore = useCallback(
    (bundle: CachedBundle) => {
      storeRef.current.bundles.set(
        makeStoreKey(bundle.locale, bundle.namespace),
        bundle,
      );
      setCachedBundle(bundle);
      loadedNamespacesRef.current.add(bundle.namespace);
      notify();
    },
    [notify],
  );

  const ensureBundle = useCallback(
    (locale: string, namespace: string): Promise<void> => {
      const key = makeStoreKey(locale, namespace);
      const inFlight = inFlightRef.current.get(key);
      if (inFlight) return inFlight;

      const cached =
        storeRef.current.bundles.get(key) ?? getCachedBundle(locale, namespace);
      if (cached && !storeRef.current.bundles.has(key)) {
        storeRef.current.bundles.set(key, cached);
        loadedNamespacesRef.current.add(namespace);
        notify();
      }

      const task = (async () => {
        try {
          const result = await fetchBundle(namespace, locale, cached);
          if (result.notModified) {
            const existing = storeRef.current.bundles.get(key);
            if (existing) {
              writeBundleToStore({ ...existing, fetchedAt: Date.now() });
            }
            return;
          }
          const fresh: CachedBundle = {
            namespace: result.bundle.namespace,
            locale: result.bundle.locale,
            etag: result.bundle.etag,
            entries: result.bundle.entries,
            fetchedAt: Date.now(),
          };
          writeBundleToStore(fresh);
        } catch (err) {
          console.warn(
            `[i18n] failed to load bundle ${namespace}/${locale}`,
            err,
          );
        } finally {
          inFlightRef.current.delete(key);
        }
      })();

      inFlightRef.current.set(key, task);
      return task;
    },
    [notify, writeBundleToStore],
  );

  const storedLocaleRef = useRef(storedLocale);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = readToken();

      const [list, me] = await Promise.all([
        fetchLocales(),
        token ? getI18nMe().catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setLocales(list);
      const enabled = list.filter((l) => l.isEnabled);
      const fallback =
        enabled.find((l) => l.locale === BASE_LOCALE)?.locale ??
        enabled[0]?.locale ??
        BASE_LOCALE;

      const serverPref = me?.preferredLocale ?? null;
      const localPref = storedLocaleRef.current ?? null;
      const serverValid =
        serverPref && enabled.some((l) => l.locale === serverPref);
      const localValid =
        localPref && enabled.some((l) => l.locale === localPref);

      let initial: string;
      if (serverValid) {
        initial = serverPref;
      } else if (localValid) {
        initial = localPref;
      } else {
        initial = fallback;
      }
      setActiveLocale(initial);
      setStoredLocale(initial);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setStoredLocale]);

  useEffect(() => {
    if (!ready || !initialNamespaces?.length) return;
    for (const ns of initialNamespaces) {
      void ensureBundle(activeLocale, ns);
      if (activeLocale !== BASE_LOCALE) {
        void ensureBundle(BASE_LOCALE, ns);
      }
    }
  }, [activeLocale, ensureBundle, initialNamespaces, ready]);

  const setLocale = useCallback(
    (next: string) => {
      if (next === activeLocale) return;
      const previousLocale = activeLocale;
      setSwitching(true);
      setActiveLocale(next);
      setStoredLocale(next);

      if (previousLocale !== BASE_LOCALE) {
        invalidateLocale(previousLocale);
        for (const key of Array.from(storeRef.current.bundles.keys())) {
          if (key.startsWith(`${previousLocale}::`)) {
            storeRef.current.bundles.delete(key);
          }
        }
      }
      notify();

      const namespaces = Array.from(loadedNamespacesRef.current);
      const tasks = namespaces.flatMap((ns) => {
        const refreshes = [ensureBundle(next, ns)];
        if (next !== BASE_LOCALE) refreshes.push(ensureBundle(BASE_LOCALE, ns));
        return refreshes;
      });
      void Promise.all(tasks).finally(() => setSwitching(false));

      void updateI18nMe({ preferredLocale: next }).catch(() => {});
    },
    [activeLocale, ensureBundle, notify, setStoredLocale],
  );

  const t = useCallback(
    (
      key: string,
      fallbackOrParams?: string | TranslateParams,
      params?: TranslateParams,
    ) => {
      const dotIdx = key.indexOf('.');
      if (dotIdx > 0 && dotIdx < key.length - 1) {
        const namespace = key.slice(0, dotIdx);
        const activeKey = makeStoreKey(activeLocale, namespace);
        if (!snapshot.bundles.has(activeKey)) {
          void ensureBundle(activeLocale, namespace);
        }
        if (activeLocale !== BASE_LOCALE) {
          const baseKey = makeStoreKey(BASE_LOCALE, namespace);
          if (!snapshot.bundles.has(baseKey)) {
            void ensureBundle(BASE_LOCALE, namespace);
          }
        }
      }
      return resolveTranslation(
        key,
        activeLocale,
        snapshot.bundles,
        fallbackOrParams,
        params,
      );
    },
    [activeLocale, ensureBundle, snapshot],
  );

  const preload = useCallback(
    async (namespaces: string[]) => {
      const tasks: Promise<void>[] = [];
      for (const ns of namespaces) {
        tasks.push(ensureBundle(activeLocale, ns));
        if (activeLocale !== BASE_LOCALE) {
          tasks.push(ensureBundle(BASE_LOCALE, ns));
        }
      }
      await Promise.all(tasks);
    },
    [activeLocale, ensureBundle],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: activeLocale,
      locales,
      setLocale,
      ready,
      switching,
      t,
      preload,
    }),
    [activeLocale, locales, preload, ready, setLocale, switching, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }
  return ctx;
};

/**
 * Convenience hook returning just the bound `t` function. Use this in 99%
 * of components; reach for `useI18n` only when you also need `setLocale` /
 * `locales` (e.g. the language picker).
 */
export const useT = (): I18nContextValue['t'] => useI18n().t;

/** Drop every cached bundle. Call from logout / tenant change flows. */
export const clearAllI18nCaches = (): void => {
  invalidateAll();
};
