import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';

// biome-ignore lint/style/useNamingConvention: global constant
export const AUDIT_LOG_TABLE_ID = 'system_audit_logs_list';

export function createAuditLogColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'action',
      label: t('AuditLogMgmt.action', '操作类型'),
      size: 120,
      minSize: 80,
      filterable: true,
      sortable: false,
      description: t('AuditLogMgmt.actionDesc', '操作类型'),
      search: {
        type: 'select',
        placeholder: t('AuditLogMgmt.actionPlaceholder', '请选择操作类型'),
        options: [
          { value: 'create', label: t('AuditLogMgmt.actionCreate', '新增') },
          { value: 'update', label: t('AuditLogMgmt.actionUpdate', '修改') },
          { value: 'delete', label: t('AuditLogMgmt.actionDelete', '删除') },
          {
            value: 'soft_delete',
            label: t('AuditLogMgmt.actionSoftDelete', '软删除'),
          },
          { value: 'restore', label: t('AuditLogMgmt.actionRestore', '恢复') },
          {
            value: 'reset_password',
            label: t('AuditLogMgmt.actionResetPassword', '重置密码'),
          },
        ],
      },
    },
    {
      key: 'resourceType',
      label: t('AuditLogMgmt.resourceType', '资源类型'),
      size: 120,
      minSize: 80,
      filterable: true,
      sortable: false,
      description: t('AuditLogMgmt.resourceTypeDesc', '资源类型'),
      search: {
        type: 'select',
        placeholder: t(
          'AuditLogMgmt.resourceTypePlaceholder',
          '请选择资源类型',
        ),
        options: [
          { value: 'user', label: t('AuditLogMgmt.resUser', '用户') },
          { value: 'role', label: t('AuditLogMgmt.resRole', '角色') },
          { value: 'tenant', label: t('AuditLogMgmt.resTenant', '租户') },
          { value: 'file', label: t('AuditLogMgmt.resFile', '文件') },
          {
            value: 'dict_type',
            label: t('AuditLogMgmt.resDictType', '字典类型'),
          },
          {
            value: 'dict_item',
            label: t('AuditLogMgmt.resDictItem', '字典项'),
          },
          {
            value: 'sys_config',
            label: t('AuditLogMgmt.resSysConfig', '系统配置'),
          },
          {
            value: 'permission',
            label: t('AuditLogMgmt.resPermission', '权限'),
          },
          { value: 'menu', label: t('AuditLogMgmt.resMenu', '菜单') },
        ],
      },
    },
    {
      key: 'resourceId',
      label: t('AuditLogMgmt.resourceId', '资源ID'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('AuditLogMgmt.resourceIdDesc', '资源ID'),
    },
    {
      key: 'ipAddress',
      label: t('AuditLogMgmt.ipAddress', 'IP地址'),
      size: 140,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('AuditLogMgmt.ipAddressDesc', '请求IP地址'),
    },
    {
      key: 'status',
      label: t('AuditLogMgmt.status', '状态'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('AuditLogMgmt.statusDesc', '操作状态'),
    },
    {
      key: 'createdAt',
      label: t('AuditLogMgmt.createdAt', '操作时间'),
      size: 180,
      minSize: 120,
      filterable: false,
      sortable: true,
      description: t('AuditLogMgmt.createdAtDesc', '操作时间'),
      search: {
        type: 'dateRange',
        order: 10,
        transform: (value: unknown) => {
          const range = value as [string, string] | undefined;
          if (!range) return {};
          return {
            from: range[0] ? `${range[0]}T00:00:00.000Z` : undefined,
            to: range[1] ? `${range[1]}T23:59:59.999Z` : undefined,
          };
        },
      },
    },
    {
      key: 'details',
      label: t('AuditLogMgmt.details', '详情'),
      size: 100,
      minSize: 80,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('AuditLogMgmt.detailsDesc', '查看变更详情'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
// All @/api imports for this module are centralized here.
// Validation wrappers will be added incrementally.

export type { AuditLogResponse, DiffEntry } from '@/api/audit-logs';
export { listAuditLogs } from '@/api/audit-logs';
