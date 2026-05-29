import { z } from 'zod';
import { unlockAccount } from '@/api/auth';
import {
  createSuperAdmin,
  createUser,
  resetUserPassword,
  syncUserRoles,
  toggleUserStatus,
  updateUser,
} from '@/api/users';
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

// ─── Table: User List ───────────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const USER_TABLE_ID = 'system_users_list';

export function createUserTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('UserMgmt.name', '姓名'),
      size: 120,
      minSize: 80,
      filterable: true,
      sortable: false,
      description: t('UserMgmt.nameDesc', '用户真实姓名'),
      search: {
        type: 'text',
        placeholder: t('UserMgmt.searchName', '搜索姓名'),
        order: 1,
      },
    },
    {
      key: 'email',
      label: t('UserMgmt.email', '邮箱'),
      filterable: true,
      sortable: false,
      description: t('UserMgmt.emailDesc', '用户登录邮箱'),
      search: {
        type: 'text',
        placeholder: t('UserMgmt.searchEmail', '搜索邮箱'),
        order: 2,
      },
    },
    {
      key: 'tenantName',
      label: t('UserMgmt.tenant', '租户'),
      size: 120,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('UserMgmt.tenantDesc', '所属租户'),
    },
    {
      key: 'roles',
      label: t('UserMgmt.roles', '角色'),
      size: 150,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('UserMgmt.rolesDesc', '用户角色列表'),
    },
    {
      key: 'status',
      label: t('UserMgmt.status', '状态'),
      size: 120,
      minSize: 100,
      maxSize: 140,
      align: 'center',
      filterable: true,
      sortable: false,
      description: t('UserMgmt.statusDesc', '用户启用/禁用状态'),
      search: {
        type: 'select',
        options: [
          { value: 'active', label: t('UserMgmt.badge.enabled', '启用') },
          { value: 'disabled', label: t('UserMgmt.badge.disabled', '禁用') },
        ],
        order: 3,
      },
    },
    {
      key: 'locked',
      label: t('UserMgmt.locked', '锁定状态'),
      size: 100,
      minSize: 80,
      maxSize: 120,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('UserMgmt.lockedDesc', '是否被锁定'),
    },
    {
      key: 'actions',
      label: t('UserMgmt.actions', '操作'),
      size: 240,
      minSize: 200,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('UserMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── Form: User Create/Edit ─────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const USER_FORM_ID = 'user_create_edit';

export function createUserFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('UserMgmt.name', '姓名'),
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: t('UserMgmt.email', '邮箱'),
      type: 'text',
      required: true,
      rule: z
        .string()
        .email(t('UserMgmt.validation.emailFormat', '邮箱格式错误')),
    },
    {
      name: 'password',
      label: t('UserMgmt.password', '密码'),
      type: 'password',
      required: true,
      rule: z
        .string()
        .min(6, t('UserMgmt.validation.passwordMinLength', '密码至少6位')),
    },
    {
      name: 'tenantCode',
      label: t('UserMgmt.tenant', '租户'),
      type: 'select',
    },
  ];
}

export function createUserEditFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('UserMgmt.name', '姓名'),
      type: 'text',
      required: true,
    },
  ];
}

// ─── Form: Reset Password ───────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const RESET_PASSWORD_FORM_ID = 'user_reset_password';

export function createResetPasswordFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'newPassword',
      label: t('UserMgmt.newPassword', '新密码'),
      type: 'password',
      required: true,
      rule: z
        .string()
        .min(6, t('UserMgmt.validation.passwordMinLength', '密码至少6位')),
    },
    {
      name: 'confirmPassword',
      label: t('UserMgmt.confirmPassword', '确认密码'),
      type: 'password',
      required: true,
      rule: z
        .string()
        .min(6, t('UserMgmt.validation.passwordMinLength', '密码至少6位')),
    },
  ];
}

// ─── Form: Role Assignment ──────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const ROLE_ASSIGN_FORM_ID = 'user_role_assign';

export function createRoleAssignFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'roleIds',
      label: t('UserMgmt.roles', '角色'),
      type: 'multiselect',
      required: true,
    },
  ];
}

// ─── Form: Super Admin ──────────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const SUPER_ADMIN_FORM_ID = 'user_super_admin';

export function createSuperAdminFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('UserMgmt.name', '姓名'),
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: t('UserMgmt.email', '邮箱'),
      type: 'text',
      required: true,
      rule: z
        .string()
        .email(t('UserMgmt.validation.emailFormat', '邮箱格式错误')),
    },
    {
      name: 'password',
      label: t('UserMgmt.password', '密码'),
      type: 'password',
      required: true,
      rule: z
        .string()
        .min(6, t('UserMgmt.validation.passwordMinLength', '密码至少6位')),
    },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

/** Params for toggleUserStatus action. */
export function createToggleStatusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'userId',
      label: t('UserMgmt.userId', '用户ID'),
      type: 'string',
      required: true,
      description: t('UserMgmt.userIdDesc', '目标用户的 ID'),
    },
    {
      name: 'status',
      label: t('UserMgmt.status', '状态'),
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: t('UserMgmt.badge.enabled', '启用') },
        { value: 'disabled', label: t('UserMgmt.badge.disabled', '禁用') },
      ],
      description: t('UserMgmt.targetStatusDesc', '要设置的状态'),
    },
  ];
}

/** Params for resetPassword action. */
export function createResetPasswordParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'userId',
      label: t('UserMgmt.userId', '用户ID'),
      type: 'string',
      required: true,
      description: t('UserMgmt.userIdDesc', '目标用户的 ID'),
    },
    {
      name: 'password',
      label: t('UserMgmt.newPassword', '新密码'),
      type: 'string',
      required: true,
      description: t('UserMgmt.newPasswordDesc', '新密码，至少6位'),
    },
  ];
}

/** Params for unlockUser action. */
export function createUnlockUserParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'userId',
      label: t('UserMgmt.userId', '用户ID'),
      type: 'string',
      required: true,
      description: t('UserMgmt.lockedUserIdDesc', '被锁定的用户 ID'),
    },
  ];
}

/** Params for assignRoles action. */
export function createAssignRolesParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'userId',
      label: t('UserMgmt.userId', '用户ID'),
      type: 'string',
      required: true,
      description: t('UserMgmt.userIdDesc', '目标用户的 ID'),
    },
    {
      name: 'roleIds',
      label: t('UserMgmt.roleIds', '角色ID列表'),
      type: 'string',
      required: true,
      description: t('UserMgmt.roleIdsDesc', '要分配的角色 ID 数组'),
    },
  ];
}

export { getErrorMessage } from '@/api/errorMap';
export { getRolesByTenant } from '@/api/roles';
export { getAllTenants } from '@/api/tenants';
export {
  getUserRoles,
  listUsers,
} from '@/api/users';
// ─── API Re-exports ────────────────────────────────────────────
// Query functions (no validation needed) — used by table loaders and inline UI.
export {
  createSuperAdmin,
  createUser,
  resetUserPassword,
  syncUserRoles,
  toggleUserStatus,
  unlockAccount,
  updateUser,
};

// ─── Validated Executors ──────────────────────────────────────
// Single entry point for mutation API calls — both Dialog and agent.ts use these.
// buildSchema validates against the same FieldConfig[] that ProFormDialog uses.

export function createUserExecutor(t: TFn) {
  return validatedFormAction(
    createUserFormFields(t),
    t,
    async (v) =>
      createUser({
        name: v.name as string,
        email: v.email as string,
        password: v.password as string,
        tenantCode: v.tenantCode as string | undefined,
      }),
    t('UserMgmt.toast.created', '创建成功'),
  );
}

export function updateUserExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('UserMgmt.userId', '用户ID'),
        type: 'text',
        required: true,
      },
      ...createUserEditFormFields(t),
    ],
    t,
    async (v) => updateUser(v.id as string, { name: v.name as string }),
    t('UserMgmt.toast.updated', '更新成功'),
  );
}

export function resetPasswordExecutor(t: TFn) {
  return validatedParamAction(
    [
      {
        name: 'userId',
        label: t('UserMgmt.userId', '用户ID'),
        type: 'string',
        required: true,
      },
      {
        name: 'password',
        label: t('UserMgmt.newPassword', '新密码'),
        type: 'string',
        required: true,
      },
    ],
    t,
    async (v) =>
      resetUserPassword(v.userId as string, {
        password: v.password as string,
      }),
    t('UserMgmt.toast.passwordReset', '密码重置成功'),
  );
}

export function createSuperAdminExecutor(t: TFn) {
  return validatedFormAction(
    createSuperAdminFormFields(t),
    t,
    async (v) =>
      createSuperAdmin({
        name: v.name as string,
        email: v.email as string,
        password: v.password as string,
      }),
    t('UserMgmt.toast.superAdminCreated', '超级管理员创建成功'),
  );
}

export function toggleUserStatusExecutor(t: TFn) {
  return validatedParamAction(
    createToggleStatusParams(t),
    t,
    async (v) =>
      toggleUserStatus(v.userId as string, {
        status: v.status as 'active' | 'disabled',
      }),
    t('UserMgmt.toast.statusUpdated', '状态更新成功'),
  );
}

export function unlockUserExecutor(t: TFn) {
  return validatedParamAction(
    createUnlockUserParams(t),
    t,
    async (v) => unlockAccount(v.email as string),
    t('UserMgmt.toast.unlocked', '已解锁'),
  );
}

export function assignRolesExecutor(t: TFn) {
  return validatedParamAction(
    createAssignRolesParams(t),
    t,
    async (v) =>
      syncUserRoles(v.userId as string, { roleIds: v.roleIds as string[] }),
    t('UserMgmt.toast.roleAssigned', '角色分配成功'),
  );
}
