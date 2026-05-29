import { z } from 'zod';
import { createTenant, createTenantAdmin, updateTenant } from '@/api/tenants';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

/**
 * Page-level capability declarations.
 * ColumnOption[] is the single source of truth — consumed by ProTable
 * (via buildColumns) and the agent system.
 */

// ─── Table: Tenant List ──────────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const TENANT_TABLE_ID = 'system_tenants_list';

export const createTenantTableColumns = (t: TFn): ColumnOption[] => [
  {
    key: 'name',
    label: t('TenantMgmt.tenantName', '租户名称'),
    size: 160,
    minSize: 100,
    filterable: true,
    sortable: false,
    description: t('TenantMgmt.tenantNameDesc', '租户名称'),
    search: {
      type: 'text',
      placeholder: t('TenantMgmt.tenantNamePlaceholder', '搜索租户名称'),
      order: 1,
    },
  },
  {
    key: 'code',
    label: t('TenantMgmt.code', '租户编码'),
    size: 140,
    minSize: 100,
    filterable: false,
    sortable: false,
    description: t('TenantMgmt.codeDesc', '租户唯一编码'),
  },
  {
    key: 'status',
    label: t('TenantMgmt.status', '状态'),
    size: 120,
    minSize: 100,
    maxSize: 140,
    align: 'center',
    filterable: true,
    sortable: false,
    description: t('TenantMgmt.statusDesc', '租户启用/禁用状态'),
    search: {
      type: 'select',
      options: [
        { value: 'active', label: t('TenantMgmt.badge.enabled', '启用') },
        { value: 'disabled', label: t('TenantMgmt.badge.disabled', '禁用') },
      ],
      order: 2,
    },
  },
  {
    key: 'description',
    label: t('TenantMgmt.description', '描述'),
    size: 200,
    minSize: 120,
    filterable: false,
    sortable: false,
    description: t('TenantMgmt.descriptionDesc', '租户描述信息'),
  },
  {
    key: 'createdAt',
    label: t('TenantMgmt.createdAt', '创建时间'),
    size: 180,
    minSize: 140,
    filterable: false,
    sortable: false,
    description: t('TenantMgmt.createdAtDesc', '创建时间'),
  },
  {
    key: 'actions',
    label: t('TenantMgmt.actions', '操作'),
    size: 200,
    minSize: 160,
    enableResizing: false,
    align: 'center',
    filterable: false,
    sortable: false,
    description: t('TenantMgmt.actionsDesc', '可执行的操作'),
  },
];

// ─── Form: Tenant Create/Edit ────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const TENANT_FORM_ID = 'tenant_create_edit';

export const createTenantFormFields = (t: TFn): FieldConfig[] => [
  {
    name: 'name',
    label: t('TenantMgmt.tenantName', '租户名称'),
    type: 'text',
    required: true,
  },
  {
    name: 'code',
    label: t('TenantMgmt.code', '租户编码'),
    type: 'text',
    required: true,
  },
  {
    name: 'status',
    label: t('TenantMgmt.status', '状态'),
    type: 'select',
    required: true,
    options: [
      { value: 'active', label: t('TenantMgmt.badge.enabled', '启用') },
      { value: 'disabled', label: t('TenantMgmt.badge.disabled', '禁用') },
    ],
  },
  {
    name: 'description',
    label: t('TenantMgmt.description', '描述'),
    type: 'textarea',
  },
];

export const createTenantEditFormFields = (t: TFn): FieldConfig[] => [
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
      { value: 'active', label: t('TenantMgmt.badge.enabled', '启用') },
      { value: 'disabled', label: t('TenantMgmt.badge.disabled', '禁用') },
    ],
  },
  {
    name: 'description',
    label: t('TenantMgmt.description', '描述'),
    type: 'textarea',
    colSpan: 2,
  },
];

// ─── Form: Create Tenant Admin ───────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const TENANT_ADMIN_FORM_ID = 'tenant_admin_create';

export const createTenantAdminFormFields = (t: TFn): FieldConfig[] => [
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
    rule: z
      .string()
      .email(t('TenantMgmt.validation.emailInvalid', '邮箱格式错误')),
  },
  {
    name: 'password',
    label: t('TenantMgmt.adminPassword', '密码'),
    type: 'password',
    required: true,
    rule: z
      .string()
      .min(6, t('TenantMgmt.validation.passwordMinLength', '密码至少6位')),
  },
];

// ─── Page Actions ────────────────────────────────────────────────

/** Params for toggleStatus action. */
export const createToggleStatusParams = (t: TFn): PageActionParam[] => [
  {
    name: 'tenantId',
    label: t('TenantMgmt.tenantId', '租户ID'),
    type: 'string',
    required: true,
    description: t('TenantMgmt.tenantIdDesc', '目标租户的 ID'),
  },
  {
    name: 'status',
    label: t('TenantMgmt.status', '状态'),
    type: 'select',
    required: true,
    options: [
      { value: 'active', label: t('TenantMgmt.badge.enabled', '启用') },
      { value: 'disabled', label: t('TenantMgmt.badge.disabled', '禁用') },
    ],
    description: t('TenantMgmt.statusToSet', '要设置的状态'),
  },
];

// ─── API Re-exports ────────────────────────────────────────────
// Query functions (no validation needed).
export { listTenants } from '@/api/tenants';

// ─── Validated Executors ──────────────────────────────────────
// Keep raw mutation re-exports for inline UI actions in index.tsx.
export { createTenant, createTenantAdmin, updateTenant };

export function createTenantExecutor(t: TFn) {
  return validatedFormAction(
    createTenantFormFields(t),
    t,
    async (v) =>
      createTenant({
        name: v.name as string,
        code: v.code as string,
        status: v.status as string | undefined,
        description: v.description as string | undefined,
      }),
    t('TenantMgmt.toast.created', '创建成功'),
  );
}

export function updateTenantExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('TenantMgmt.tenantId', '租户ID'),
        type: 'text',
        required: true,
      },
      ...createTenantEditFormFields(t),
    ],
    t,
    async (v) =>
      updateTenant(v.id as string, {
        name: v.name as string,
        status: v.status as string,
        description: (v.description as string) || null,
      }),
    t('TenantMgmt.toast.updated', '更新成功'),
  );
}

export function toggleTenantStatusExecutor(t: TFn) {
  return validatedParamAction(
    createToggleStatusParams(t),
    t,
    async (v) =>
      updateTenant(v.tenantId as string, { status: v.status as string }),
    t('TenantMgmt.toast.statusUpdated', '状态更新成功'),
  );
}

export function createTenantAdminExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'tenantCode',
        label: t('TenantMgmt.code', '租户编码'),
        type: 'text',
        required: true,
      },
      ...createTenantAdminFormFields(t),
    ],
    t,
    async (v) =>
      createTenantAdmin(v.tenantCode as string, {
        name: v.name as string,
        email: v.email as string,
        password: v.password as string,
      }),
    t('TenantMgmt.toast.adminCreated', '管理员创建成功'),
  );
}
