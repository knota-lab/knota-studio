import {
  deletePermission,
  getPermissionsWithMetadata,
  syncPermissions,
  updatePermission,
} from '@/api/permissions';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';
import type { MergedPermission } from '@/types/permission';

// biome-ignore lint/style/useNamingConvention: global constant
export const PERMISSION_TABLE_ID = 'system_permissions_list';

export function createPermTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'tag',
      label: t('PermMgmt.columnTag', '模块分类'),
      size: 120,
      minSize: 80,
      filterable: true,
      sortable: false,
      description: t('PermMgmt.columnTagDesc', '接口所属模块分类'),
    },
    {
      key: 'description',
      label: t('PermMgmt.columnDescription', '接口说明'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('PermMgmt.columnDescriptionDesc', 'API接口描述说明'),
    },
    {
      key: 'method',
      label: t('PermMgmt.columnMethod', '请求方法'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: true,
      sortable: false,
      description: t('PermMgmt.columnMethodDesc', 'HTTP请求方法'),
    },
    {
      key: 'path',
      label: t('PermMgmt.columnPath', '路由地址'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('PermMgmt.columnPathDesc', 'API路由路径'),
    },
    {
      key: 'status',
      label: t('PermMgmt.columnStatus', '状态'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: true,
      sortable: false,
      description: t('PermMgmt.columnStatusDesc', '权限匹配状态'),
    },
    {
      key: 'isSystem',
      label: t('PermMgmt.isSystem', '系统内置'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('PermMgmt.isSystemDesc', '是否为系统内置权限'),
    },
    {
      key: 'actions',
      label: t('PermMgmt.actions', '操作'),
      size: 160,
      minSize: 120,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('PermMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// biome-ignore lint/style/useNamingConvention: global constant
export const PERMISSION_FORM_ID = 'permission_edit';

function createPermissionTypeOptions(t: TFn) {
  return [
    { value: 'api', label: 'API' },
    { value: 'menu', label: t('PermMgmt.typeMenu', '菜单') },
    { value: 'data', label: t('PermMgmt.typeData', '数据') },
  ];
}

/** Fields for editing an existing permission */
export function createPermEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('PermMgmt.permName', '权限名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'code',
      label: t('PermMgmt.code', '权限编码'),
      type: 'text',
      required: true,
    },
    {
      name: 'obj',
      label: t('PermMgmt.resource', '资源'),
      type: 'text',
      required: true,
    },
    {
      name: 'act',
      label: t('PermMgmt.action', '操作'),
      type: 'text',
      required: true,
    },
    {
      name: 'permissionType',
      label: t('PermMgmt.type', '类型'),
      type: 'select',
      required: true,
      options: createPermissionTypeOptions(t),
    },
    {
      name: 'isSystem',
      label: t('PermMgmt.isSystem', '系统内置'),
      type: 'boolean',
    },
  ];
}

// ─── Filter Helpers ───────────────────────────────────────────

export function createMethodFilterOptions(_t: TFn) {
  return [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
  ];
}

export function createStatusFilterOptions(t: TFn) {
  return [
    { value: '', label: t('PermMgmt.statusAll', '全部') },
    { value: 'active', label: t('PermMgmt.statusActive', '已配置') },
    { value: 'new', label: t('PermMgmt.statusNew', '新增') },
    { value: 'stale', label: t('PermMgmt.statusStale', '已失效') },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

/** Params for deletePermission action. */
export function createDeletePermissionParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'permissionId',
      label: t('PermMgmt.permId', '权限ID'),
      type: 'string',
      required: true,
      description: t('PermMgmt.permIdDeleteDesc', '要删除的权限 ID'),
    },
  ];
}

/** Params for syncSingleRoute action. */
export function createSyncSingleRouteParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'path',
      label: t('PermMgmt.syncPath', '路由路径'),
      type: 'string',
      required: true,
      description: t('PermMgmt.syncPathDesc', '要同步的路由路径'),
    },
    {
      name: 'method',
      label: t('PermMgmt.syncMethod', '请求方法'),
      type: 'string',
      required: true,
      description: t('PermMgmt.syncMethodDesc', '要同步的HTTP方法'),
    },
  ];
}

/** Params for clearSinglePermission action. */
export function createClearSinglePermissionParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'permissionId',
      label: t('PermMgmt.permId', '权限ID'),
      type: 'string',
      required: true,
      description: t('PermMgmt.permIdClearDesc', '要清理的失效权限 ID'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export {
  deletePermission,
  getPermissionsWithMetadata,
  syncPermissions,
  updatePermission,
};

// ─── Merged Data Helpers ──────────────────────────────────────

export function mergePermissionData(
  permissions: import('@/types/permission').PermissionWithMetadata[],
  unmatchedRoutes: import('@/types/permission').RouteMetadataItem[],
  t: TFn,
): MergedPermission[] {
  const activeStale = permissions.map((perm) => {
    const hasRoute = perm.tag !== '' || perm.description !== '';
    return {
      id: perm.id,
      path: perm.obj,
      method: perm.act,
      tag: perm.tag || t('PermMgmt.fallbackUnknownTag', '未知模块'),
      description:
        perm.description ||
        perm.name ||
        t('PermMgmt.fallbackUnknownDesc', '未知接口'),
      name: perm.name,
      isSystem: perm.isSystem,
      status: hasRoute ? ('active' as const) : ('stale' as const),
      permissionId: perm.id,
      version: perm.version,
    };
  });

  const newRoutes = unmatchedRoutes.map((route) => ({
    id: `new-${route.path}-${route.method}`,
    path: route.path,
    method: route.method,
    tag: route.tag,
    description: route.description,
    status: 'new' as const,
  }));

  return [...activeStale, ...newRoutes];
}

// ─── Validated Executors ──────────────────────────────────────
export function updatePermissionExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('PermMgmt.permId', '权限ID'),
        type: 'text',
        required: true,
      },
      {
        name: 'name',
        label: t('PermMgmt.permName', '权限名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'code',
        label: t('PermMgmt.permCode', '权限编码'),
        type: 'text',
        required: true,
      },
      {
        name: 'obj',
        label: t('PermMgmt.obj', '资源'),
        type: 'text',
        required: true,
      },
      {
        name: 'act',
        label: t('PermMgmt.act', '操作'),
        type: 'text',
        required: true,
      },
      {
        name: 'permissionType',
        label: t('PermMgmt.permissionType', '权限类型'),
        type: 'select',
        required: true,
      },
      {
        name: 'isSystem',
        label: t('PermMgmt.isSystem', '系统内置'),
        type: 'boolean',
      },
      {
        name: 'version',
        label: t('PermMgmt.version', '版本号'),
        type: 'number',
        required: true,
      },
    ],
    t,
    async (v) =>
      updatePermission(v.id as string, {
        name: v.name as string,
        code: v.code as string,
        obj: v.obj as string,
        act: v.act as string,
        permissionType: v.permissionType as string,
        isSystem: v.isSystem as boolean,
        version: v.version as number,
      }),
    t('PermMgmt.toast.updated', '权限更新成功'),
  );
}

export function deletePermissionExecutor(t: TFn) {
  return validatedParamAction(
    createDeletePermissionParams(t),
    t,
    async (v) => deletePermission(v.permissionId as string),
    t('PermMgmt.toast.deleted', '权限删除成功'),
  );
}

export function batchSyncPermissionsExecutor(_t: TFn) {
  return async () => {
    const metadata = await getPermissionsWithMetadata();
    const items = (metadata.unmatchedRoutes ?? []).map((r) => ({
      path: r.path,
      method: r.method,
    }));
    if (items.length === 0) {
      return;
    }
    await syncPermissions({ items });
  };
}

export function batchClearStalePermissionsExecutor(_t: TFn) {
  return async () => {
    const metadata = await getPermissionsWithMetadata();
    const staleIds = (metadata.permissions ?? [])
      .filter((p) => p.tag === '' && p.description === '')
      .map((p) => p.id);
    if (staleIds.length === 0) {
      return;
    }
    await Promise.all(staleIds.map((id) => deletePermission(id)));
  };
}

export function syncSingleRouteExecutor(t: TFn) {
  return validatedParamAction(
    createSyncSingleRouteParams(t),
    t,
    async (v) =>
      syncPermissions({
        items: [{ path: v.path as string, method: v.method as string }],
      }),
    t('PermMgmt.toast.synced', '同步成功'),
  );
}

export function clearSinglePermissionExecutor(t: TFn) {
  return validatedParamAction(
    createClearSinglePermissionParams(t),
    t,
    async (v) => deletePermission(v.permissionId as string),
    t('PermMgmt.toast.cleared', '清理成功'),
  );
}
