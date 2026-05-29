import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  createTenantAdminExecutor,
  createTenantAdminFormFields,
  createTenantExecutor,
  createTenantFormFields,
  createTenantTableColumns,
  createToggleStatusParams,
  listTenants,
  TENANT_ADMIN_FORM_ID,
  TENANT_FORM_ID,
  TENANT_TABLE_ID,
  toggleTenantStatusExecutor,
  updateTenantExecutor,
} from './options';

/**
 * Register the Tenants page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useTenantsAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const tenantTableColumns = createTenantTableColumns(t);
      const tenantFormFields = createTenantFormFields(t);
      const tenantAdminFormFields = createTenantAdminFormFields(t);
      const toggleStatusParams = createToggleStatusParams(t);

      return {
        meta: {
          route: '/system/tenants',
          pageKey: 'system_tenants',
          title: t('TenantMgmt.title', '租户管理'),
          intent: 'list',
          description: t(
            'TenantMgmt.titleDesc',
            '管理租户，包括创建、编辑、切换状态、创建管理员等操作',
          ),
        },
        tables: [
          {
            tableId: TENANT_TABLE_ID,
            columns: [...tenantTableColumns],
            filterFields: extractFilterFields(tenantTableColumns),
            loader: async (params) => {
              const resp = await listTenants({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: TENANT_FORM_ID,
            fields: tenantFormFields,
          },
          {
            formId: TENANT_ADMIN_FORM_ID,
            fields: tenantAdminFormFields,
          },
        ],
        actions: [
          // Form-based actions
          {
            actionKey: 'createTenant',
            label: t('TenantMgmt.dialog.create', '创建租户'),
            description: t('TenantMgmt.dialog.createDesc', '创建新租户'),
            formId: TENANT_FORM_ID,
            mode: 'create',
            execute: createTenantExecutor(t),
          },
          {
            actionKey: 'editTenant',
            label: t('TenantMgmt.dialog.edit', '编辑租户'),
            description: t('TenantMgmt.dialog.editDesc', '编辑租户信息'),
            formId: TENANT_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('TenantMgmt.tenantId', '租户ID'),
                type: 'text',
                required: true,
                description: t(
                  'TenantMgmt.editTenantIdDesc',
                  '要编辑的租户ID，从表格数据中获取',
                ),
              },
              {
                name: 'name',
                label: t('TenantMgmt.tenantName', '租户名称'),
                type: 'text',
                required: true,
              },
              {
                name: 'status',
                label: t('TenantMgmt.status', '状态'),
                type: 'select',
                required: true,
                options: [
                  {
                    value: 'active',
                    label: t('TenantMgmt.badge.enabled', '启用'),
                  },
                  {
                    value: 'disabled',
                    label: t('TenantMgmt.badge.disabled', '禁用'),
                  },
                ],
              },
              {
                name: 'description',
                label: t('TenantMgmt.description', '描述'),
                type: 'textarea',
              },
            ],
            execute: updateTenantExecutor(t),
          },
          // Page-level actions (explicit params)
          {
            actionKey: 'toggleStatus',
            label: t('TenantMgmt.action.toggleStatus', '切换租户状态'),
            description: t(
              'TenantMgmt.action.toggleStatusDesc',
              '启用或禁用指定租户。',
            ),
            params: toggleStatusParams,
            execute: toggleTenantStatusExecutor(t),
          },
          {
            actionKey: 'createTenantAdmin',
            label: t('TenantMgmt.action.createAdmin', '创建租户管理员'),
            description: t(
              'TenantMgmt.action.createAdminDesc',
              '为指定租户创建管理员账户。',
            ),
            formId: TENANT_ADMIN_FORM_ID,
            mode: 'create',
            fields: [
              {
                name: 'tenantCode',
                label: t('TenantMgmt.code', '租户编码'),
                type: 'text',
                required: true,
                description: t(
                  'TenantMgmt.adminTenantCodeDesc',
                  '目标租户的编码，从表格数据中获取',
                ),
              },
              {
                name: 'name',
                label: t('TenantMgmt.adminName', '姓名'),
                type: 'text',
                required: true,
              },
              {
                name: 'email',
                label: t('TenantMgmt.adminEmail', '邮箱'),
                type: 'text',
                required: true,
              },
              {
                name: 'password',
                label: t('TenantMgmt.adminPassword', '密码'),
                type: 'password',
                required: true,
              },
            ],
            execute: createTenantAdminExecutor(t),
          },
        ],
      };
    }, [t]),
  );
};
