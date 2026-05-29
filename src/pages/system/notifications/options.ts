import {
  createNotification,
  markAllRead,
  markRead,
  revokeNotification,
} from '@/api/notifications';
import { listRoles } from '@/api/roles';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const NOTIFICATION_INBOX_TABLE_ID = 'notification_inbox_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const NOTIFICATION_MANAGE_TABLE_ID = 'notification_manage_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const NOTIFICATION_CREATE_FORM_ID = 'notification_create';

// ─── Inbox Table Columns ─────────────────────────────────

export function createInboxColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'title',
      label: t('NotificationMgmt.inbox.column.title', '标题'),
      size: 240,
      filterable: false,
      description: t('NotificationMgmt.inbox.column.titleDesc', '通知标题'),
    },
    {
      key: 'notificationType',
      label: t('NotificationMgmt.inbox.column.type', '类型'),
      size: 120,
      align: 'center',
      filterable: false,
      description: t('NotificationMgmt.inbox.column.typeDesc', '通知类型'),
    },
    {
      key: 'priority',
      label: t('NotificationMgmt.inbox.column.priority', '优先级'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t('NotificationMgmt.inbox.column.priorityDesc', '优先级'),
    },
    {
      key: 'senderName',
      label: t('NotificationMgmt.inbox.column.sender', '发送人'),
      size: 120,
      filterable: false,
      description: t('NotificationMgmt.inbox.column.senderDesc', '发送人'),
    },
    {
      key: 'senderTenantName',
      label: t('NotificationMgmt.inbox.column.senderTenant', '发送方租户'),
      size: 140,
      filterable: false,
      description: t(
        'NotificationMgmt.inbox.column.senderTenantDesc',
        '发送方租户名称',
      ),
    },
    {
      key: 'readAt',
      label: t('NotificationMgmt.inbox.column.readStatus', '状态'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t(
        'NotificationMgmt.inbox.column.readStatusDesc',
        '已读/未读状态',
      ),
    },
    {
      key: 'createdAt',
      label: t('NotificationMgmt.inbox.column.createdAt', '时间'),
      size: 160,
      filterable: false,
      description: t(
        'NotificationMgmt.inbox.column.createdAtDesc',
        '通知创建时间',
      ),
    },
  ];
}

// ─── Manage Table Columns ────────────────────────────────

export function createManageColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'title',
      label: t('NotificationMgmt.manage.column.title', '标题'),
      size: 280,
      filterable: false,
      description: t('NotificationMgmt.manage.column.titleDesc', '通知标题'),
    },
    {
      key: 'notificationType',
      label: t('NotificationMgmt.manage.column.type', '类型'),
      size: 140,
      align: 'center',
      filterable: true,
      search: {
        type: 'select',
        placeholder: t(
          'NotificationMgmt.manage.column.typePlaceholder',
          '筛选类型',
        ),
      },
      description: t('NotificationMgmt.manage.column.typeDesc', '通知类型'),
    },
    {
      key: 'priority',
      label: t('NotificationMgmt.manage.column.priority', '优先级'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t('NotificationMgmt.manage.column.priorityDesc', '优先级'),
    },
    {
      key: 'status',
      label: t('NotificationMgmt.manage.column.status', '状态'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t('NotificationMgmt.manage.column.statusDesc', '通知状态'),
    },
    {
      key: 'createdAt',
      label: t('NotificationMgmt.manage.column.createdAt', '创建时间'),
      size: 180,
      filterable: false,
      description: t(
        'NotificationMgmt.manage.column.createdAtDesc',
        '通知创建时间',
      ),
    },
    {
      key: 'actions',
      label: t('NotificationMgmt.manage.column.actions', '操作'),
      size: 120,
      enableResizing: false,
      align: 'center',
      filterable: false,
      description: t(
        'NotificationMgmt.manage.column.actionsDesc',
        '可执行的操作',
      ),
    },
  ];
}

// ─── Create Notification Form Fields ─────────────────────

export function createNotificationFormFields(
  t: TFn,
  tenantCode?: string,
  isSuperAdmin?: boolean,
): FieldConfig[] {
  const typeOptions: { value: string; label: string }[] = [];
  if (isSuperAdmin) {
    typeOptions.push({
      value: 'platform',
      label: t('NotificationMgmt.type.platform', '平台通知'),
    });
  }
  typeOptions.push(
    {
      value: 'tenant_all',
      label: t('NotificationMgmt.type.tenantAll', '全员通知'),
    },
    {
      value: 'tenant_role',
      label: t('NotificationMgmt.type.tenantRole', '角色通知'),
    },
  );

  return [
    {
      name: 'title',
      label: t('NotificationMgmt.form.title', '标题'),
      type: 'text',
      required: true,
      colSpan: 2,
    },
    {
      name: 'content',
      label: t('NotificationMgmt.form.content', '内容'),
      type: 'textarea',
      required: true,
      colSpan: 2,
    },
    {
      name: 'notificationType',
      label: t('NotificationMgmt.form.type', '通知类型'),
      type: 'select',
      required: true,
      defaultValue: 'tenant_all',
      options: typeOptions,
    },
    {
      name: 'priority',
      label: t('NotificationMgmt.form.priority', '优先级'),
      type: 'select',
      defaultValue: 'normal',
      options: [
        {
          value: 'normal',
          label: t('NotificationMgmt.priority.normal', '普通'),
        },
        {
          value: 'high',
          label: t('NotificationMgmt.priority.high', '紧急'),
        },
      ],
    },
    {
      name: 'targetRoleCodes',
      label: t('NotificationMgmt.form.targetRoles', '目标角色'),
      type: 'multiselect',
      showWhen: { field: 'notificationType', value: 'tenant_role' },
      required: true,
      remote: {
        resolver: async () => {
          const params: {
            page: number;
            pageSize: number;
            status: string;
            tenantCode?: string;
          } = { page: 1, pageSize: 200, status: 'active' };
          if (tenantCode) {
            params.tenantCode = tenantCode;
          }
          const res = await listRoles(params);
          return (res.items ?? []).map((role) => ({
            value: role.code,
            label: role.name,
          }));
        },
      },
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export type {
  InboxItemResponse,
  NotificationResponse,
} from '@/api/notifications';
export {
  getInbox,
  listNotifications,
} from '@/api/notifications';
export { createNotification, markAllRead, markRead, revokeNotification };

// ─── Validated Executors ──────────────────────────────────────
export function createNotificationExecutor(t: TFn) {
  return validatedFormAction(
    createNotificationFormFields(t),
    t,
    async (v) =>
      createNotification({
        title: v.title as string,
        content: v.content as string,
        notificationType: v.notificationType as string,
        priority: v.priority as string,
        targetRoleCodes: v.targetRoleCodes as string[] | undefined,
      }),
    t('NotificationMgmt.toast.created', '通知创建成功'),
  );
}

export function revokeNotificationExecutor(t: TFn) {
  return validatedParamAction(
    [{ name: 'id', label: 'ID', type: 'string', required: true }],
    t,
    async (v) => revokeNotification(v.id as string),
    t('NotificationMgmt.toast.revoked', '通知已撤回'),
  );
}

export function markReadExecutor(t: TFn) {
  return validatedParamAction(
    [{ name: 'id', label: 'ID', type: 'string', required: true }],
    t,
    async (v) => markRead(v.id as string),
    t('NotificationMgmt.toast.markedRead', '已标记已读'),
  );
}

export function markAllReadExecutor(_t: TFn) {
  return async () => {
    await markAllRead();
  };
}
