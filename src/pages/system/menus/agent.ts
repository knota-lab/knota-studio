import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import {
  createMenuOverrideFormFields,
  createMenuTableColumns,
  createResetMenuParams,
  getTenantMenuTree,
  MENU_OVERRIDE_FORM_ID,
  overrideMenuExecutor,
  resetMenuExecutor,
  TENANT_MENU_TABLE_ID,
} from './options';

/**
 * Register the Menus (tenant menu config) page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useMenusAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/menus',
          pageKey: 'system_menus',
          title: t('MenuMgmt.title', '租户菜单配置'),
          intent: 'list',
          description: t(
            'MenuMgmt.titleDesc',
            '配置租户菜单的自定义覆盖，包括自定义名称、图标、排序和隐藏状态',
          ),
        },
        tables: [
          {
            tableId: TENANT_MENU_TABLE_ID,
            columns: [...createMenuTableColumns(t)],
            filterFields: extractFilterFields(createMenuTableColumns(t)),
            loader: async () => {
              const resp = await getTenantMenuTree();
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: MENU_OVERRIDE_FORM_ID,
            fields: createMenuOverrideFormFields(t),
          },
        ],
        actions: [
          {
            actionKey: 'overrideMenu',
            label: t('MenuMgmt.action.overrideMenu', '自定义菜单'),
            description: t(
              'MenuMgmt.action.overrideMenuDesc',
              '为指定菜单设置自定义覆盖（名称、图标、排序、隐藏）',
            ),
            formId: MENU_OVERRIDE_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'sysMenuId',
                label: t('MenuMgmt.menuId', '菜单ID'),
                type: 'text',
                required: true,
                description: t(
                  'MenuMgmt.menuIdOverrideDesc',
                  '要自定义的系统菜单 ID',
                ),
              },
              ...createMenuOverrideFormFields(t),
            ],
            execute: overrideMenuExecutor(t),
          },
          {
            actionKey: 'resetMenu',
            label: t('MenuMgmt.action.resetMenu', '恢复默认菜单'),
            description: t(
              'MenuMgmt.action.resetMenuDesc',
              '移除指定菜单的自定义覆盖，恢复为系统默认配置',
            ),
            params: createResetMenuParams(t),
            execute: resetMenuExecutor(t),
          },
        ],
      }),
      [t],
    ),
  );
};
