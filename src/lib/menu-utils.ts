import { useRequest } from 'ahooks';
import { useMemo } from 'react';
import { getUserMenus } from '@/api/menu';
import type { MergedMenuTreeResponse } from '@/types/api';

/**
 * Flatten a menu tree into a flat array of all node `code` values.
 * Useful for permission checks — check if a code exists in the result.
 */
export function flattenMenuCodes(items: MergedMenuTreeResponse[]): string[] {
  return items.reduce<string[]>((acc, item) => {
    acc.push(item.code);
    if (item.children.length > 0) {
      acc.push(...flattenMenuCodes(item.children));
    }
    return acc;
  }, []);
}

/**
 * Hook: returns a Set of all menu `code` values the current user has access to.
 * Cached via useRequest (fetches once). Used for page-level tab/permission control.
 *
 * @example
 * const menuCodes = useUserMenuCodes();
 * const canSeeLocales = menuCodes.has('i18n:locales');
 */
export function useUserMenuCodes(): Set<string> {
  const { data: menuTree } = useRequest(getUserMenus);

  return useMemo(() => {
    if (!menuTree || menuTree.length === 0) return new Set<string>();
    return new Set(flattenMenuCodes(menuTree));
  }, [menuTree]);
}
