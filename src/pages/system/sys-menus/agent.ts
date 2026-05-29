import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import {
  createDeleteSysMenuParams,
  createSysMenuCreateFields,
  createSysMenuEditFields,
  createSysMenuExecutor,
  createSysMenuTableColumns,
  deleteSysMenuExecutor,
  getSysMenuTree,
  SYS_MENU_FORM_ID,
  SYS_MENU_TABLE_ID,
  updateSysMenuExecutor,
} from './options';

/**
 * Register the SysMenus page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useSysMenusAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const tableColumns = createSysMenuTableColumns(t);
      const createFields = createSysMenuCreateFields(t);
      const editFields = createSysMenuEditFields(t);
      return {
        meta: {
          route: '/system/sys-menus',
          pageKey: 'system_sys_menus',
          title: t('SysMenuMgmt.title', '系统菜单管理'),
          intent: 'list',
          description: t(
            'SysMenuMgmt.description',
            '管理系统菜单的增删改查，包括目录、菜单、按钮三种类型',
          ),
        },
        tables: [
          {
            tableId: SYS_MENU_TABLE_ID,
            columns: [...tableColumns],
            filterFields: extractFilterFields(tableColumns),
            loader: async () => {
              const resp = await getSysMenuTree();
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: SYS_MENU_FORM_ID,
            fields: createFields,
          },
        ],
        actions: [
          {
            actionKey: 'createSysMenu',
            label: t('SysMenuMgmt.action.create', '创建系统菜单'),
            description: t(
              'SysMenuMgmt.action.createDesc',
              '创建新的系统菜单（目录/菜单/按钮）',
            ),
            formId: SYS_MENU_FORM_ID,
            mode: 'create',
            fields: createFields,
            execute: createSysMenuExecutor(t),
          },
          {
            actionKey: 'editSysMenu',
            label: t('SysMenuMgmt.action.edit', '编辑系统菜单'),
            description: t('SysMenuMgmt.action.editDesc', '编辑系统菜单信息'),
            formId: SYS_MENU_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('SysMenuMgmt.menuId', '菜单ID'),
                type: 'text',
                required: true,
                description: t(
                  'SysMenuMgmt.menuIdEditDesc',
                  '要编辑的菜单ID，从表格数据中获取',
                ),
              },
              {
                name: 'version',
                label: t('SysMenuMgmt.version', '版本号'),
                type: 'number',
                required: true,
                description: t(
                  'SysMenuMgmt.versionDesc',
                  '菜单当前版本号，用于乐观锁',
                ),
              },
              ...editFields,
            ],
            execute: updateSysMenuExecutor(t),
          },
          {
            actionKey: 'deleteSysMenu',
            label: t('SysMenuMgmt.action.delete', '删除系统菜单'),
            description: t(
              'SysMenuMgmt.action.deleteDesc',
              '删除指定的系统菜单',
            ),
            params: createDeleteSysMenuParams(t),
            execute: deleteSysMenuExecutor(t),
          },
        ],
      };
    }, [t]),
  );
};
