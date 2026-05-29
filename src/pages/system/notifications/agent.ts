import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { useAuth } from '@/stores/auth';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  createInboxColumns,
  createManageColumns,
  createNotificationExecutor,
  createNotificationFormFields,
  getInbox,
  listNotifications,
  markAllReadExecutor,
  markReadExecutor,
  NOTIFICATION_CREATE_FORM_ID,
  NOTIFICATION_INBOX_TABLE_ID,
  NOTIFICATION_MANAGE_TABLE_ID,
  revokeNotificationExecutor,
} from './options';

export const useNotificationAgent = () => {
  const t = useT();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode;
  const isSuperAdmin = user?.isSuperAdmin;

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/notifications',
          pageKey: 'system_notifications',
          title: t('NotificationMgmt.title', '通知管理'),
          intent: 'list',
          description: t(
            'NotificationMgmt.titleDesc',
            '管理通知收件箱和通知公告',
          ),
        },
        tables: [
          {
            tableId: NOTIFICATION_INBOX_TABLE_ID,
            columns: [...createInboxColumns(t)],
            filterFields: extractFilterFields(createInboxColumns(t)),
            loader: async (params) => {
              const resp = await getInbox({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
          {
            tableId: NOTIFICATION_MANAGE_TABLE_ID,
            columns: [...createManageColumns(t)],
            filterFields: extractFilterFields(createManageColumns(t)),
            loader: async (params) => {
              const resp = await listNotifications({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
                notificationType: params.notificationType as string | undefined,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: NOTIFICATION_CREATE_FORM_ID,
            fields: createNotificationFormFields(t, tenantCode, isSuperAdmin),
          },
        ],
        actions: [
          {
            actionKey: 'createNotification',
            label: t('NotificationMgmt.action.create', '发送通知'),
            description: t(
              'NotificationMgmt.action.createDesc',
              '创建并发送新通知',
            ),
            formId: NOTIFICATION_CREATE_FORM_ID,
            mode: 'create',
            fields: createNotificationFormFields(t, tenantCode, isSuperAdmin),
            execute: createNotificationExecutor(t),
          },
          {
            actionKey: 'revokeNotification',
            label: t('NotificationMgmt.action.revoke', '撤回通知'),
            description: t(
              'NotificationMgmt.action.revokeDesc',
              '撤回指定的通知',
            ),
            params: [
              {
                name: 'id',
                label: t('NotificationMgmt.param.id', '通知ID'),
                type: 'string',
                required: true,
                description: t(
                  'NotificationMgmt.param.idDesc',
                  '要撤回的通知 ID',
                ),
              },
            ],
            execute: revokeNotificationExecutor(t),
          },
          {
            actionKey: 'markRead',
            label: t('NotificationMgmt.action.markRead', '标为已读'),
            description: t(
              'NotificationMgmt.action.markReadDesc',
              '将指定收件箱通知标为已读',
            ),
            params: [
              {
                name: 'id',
                label: t('NotificationMgmt.param.inboxId', '收件箱ID'),
                type: 'string',
                required: true,
                description: t(
                  'NotificationMgmt.param.inboxIdDesc',
                  '收件箱条目 ID',
                ),
              },
            ],
            execute: markReadExecutor(t),
          },
          {
            actionKey: 'markAllRead',
            label: t('NotificationMgmt.action.markAllRead', '全部标为已读'),
            description: t(
              'NotificationMgmt.action.markAllReadDesc',
              '将所有收件箱通知标为已读',
            ),
            params: [],
            execute: markAllReadExecutor(t),
          },
        ],
      }),
      [t, tenantCode, isSuperAdmin],
    ),
  );
};
