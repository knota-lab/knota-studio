import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import type { MergedPermission } from '@/types/permission';
import {
  batchClearStalePermissionsExecutor,
  batchSyncPermissionsExecutor,
  clearSinglePermissionExecutor,
  createClearSinglePermissionParams,
  createDeletePermissionParams,
  createPermEditFields,
  createPermTableColumns,
  createSyncSingleRouteParams,
  deletePermissionExecutor,
  getPermissionsWithMetadata,
  mergePermissionData,
  PERMISSION_FORM_ID,
  PERMISSION_TABLE_ID,
  syncSingleRouteExecutor,
  updatePermissionExecutor,
} from './options';

/**
 * Register the Permissions page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const usePermissionsAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const columns = createPermTableColumns(t);
      const editFields = createPermEditFields(t);

      return {
        meta: {
          route: '/system/permissions',
          pageKey: 'system_permissions',
          title: t('PermMgmt.title', '权限管理'),
          intent: 'list',
          description: t(
            'PermMgmt.description',
            '管理系统权限，合并路由对比视图：已配置/新增/已失效三态管理',
          ),
        },
        tables: [
          {
            tableId: PERMISSION_TABLE_ID,
            columns: [...columns],
            filterFields: extractFilterFields(columns),
            loader: async () => {
              const metadata = await getPermissionsWithMetadata();
              return mergePermissionData(
                metadata.permissions ?? [],
                metadata.unmatchedRoutes ?? [],
                t,
              ) as unknown as import('@/types/common').PaginatedResponse<MergedPermission>;
            },
          },
        ],
        forms: [
          {
            formId: PERMISSION_FORM_ID,
            fields: editFields,
          },
        ],
        actions: [
          {
            actionKey: 'editPermission',
            label: t('PermMgmt.actionEdit', '编辑权限'),
            description: t('PermMgmt.actionEditDesc', '编辑权限信息'),
            formId: PERMISSION_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('PermMgmt.permId', '权限ID'),
                type: 'text',
                required: true,
                description: t(
                  'PermMgmt.permIdEditDesc',
                  '要编辑的权限ID，从表格数据中获取',
                ),
              },
              {
                name: 'version',
                label: t('PermMgmt.version', '版本号'),
                type: 'number',
                required: true,
                description: t(
                  'PermMgmt.versionDesc',
                  '权限当前版本号，用于乐观锁',
                ),
              },
              ...editFields,
            ],
            execute: updatePermissionExecutor(t),
          },
          {
            actionKey: 'deletePermission',
            label: t('PermMgmt.actionDelete', '删除权限'),
            description: t('PermMgmt.actionDeleteDesc', '删除指定的权限'),
            params: createDeletePermissionParams(t),
            execute: deletePermissionExecutor(t),
          },
          {
            actionKey: 'batchSyncPermissions',
            label: t('PermMgmt.actionBatchSync', '批量同步'),
            description: t(
              'PermMgmt.actionBatchSyncDesc',
              '同步所有未匹配的路由为权限',
            ),
            execute: batchSyncPermissionsExecutor(t),
          },
          {
            actionKey: 'batchClearStale',
            label: t('PermMgmt.actionBatchClear', '批量清理'),
            description: t(
              'PermMgmt.actionBatchClearDesc',
              '清理所有失效权限（tag和description为空的记录）',
            ),
            execute: batchClearStalePermissionsExecutor(t),
          },
          {
            actionKey: 'syncSingleRoute',
            label: t('PermMgmt.actionSyncSingle', '同步单条路由'),
            description: t(
              'PermMgmt.actionSyncSingleDesc',
              '将单条未匹配路由同步为权限',
            ),
            params: createSyncSingleRouteParams(t),
            execute: syncSingleRouteExecutor(t),
          },
          {
            actionKey: 'clearSinglePermission',
            label: t('PermMgmt.actionClearSingle', '清理单条失效权限'),
            description: t(
              'PermMgmt.actionClearSingleDesc',
              '删除单条失效权限',
            ),
            params: createClearSinglePermissionParams(t),
            execute: clearSinglePermissionExecutor(t),
          },
        ],
      };
    }, [t]),
  );
};
