import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  assignRolesExecutor,
  createAssignRolesParams,
  createResetPasswordParams,
  createRoleAssignFormFields,
  createSuperAdminExecutor,
  createSuperAdminFormFields,
  createToggleStatusParams,
  createUnlockUserParams,
  createUserExecutor,
  createUserFormFields,
  createUserTableColumns,
  listUsers,
  RESET_PASSWORD_FORM_ID,
  ROLE_ASSIGN_FORM_ID,
  resetPasswordExecutor,
  SUPER_ADMIN_FORM_ID,
  toggleUserStatusExecutor,
  USER_FORM_ID,
  USER_TABLE_ID,
  unlockUserExecutor,
  updateUserExecutor,
} from './options';

/**
 * Register the Users page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useUsersAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const tableColumns = createUserTableColumns(t);
      return {
        meta: {
          route: '/system/users',
          pageKey: 'system_users',
          title: t('UserMgmt.title', '用户管理'),
          intent: 'list',
          description: t(
            'UserMgmt.meta.description',
            '管理系统用户，包括创建、编辑、禁用、重置密码、分配角色等操作',
          ),
        },
        tables: [
          {
            tableId: USER_TABLE_ID,
            columns: [...tableColumns],
            filterFields: extractFilterFields(tableColumns),
            loader: async (params) => {
              const resp = await listUsers({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: USER_FORM_ID,
            fields: createUserFormFields(t),
          },
          {
            formId: RESET_PASSWORD_FORM_ID,
            fields: createRoleAssignFormFields(t),
          },
          {
            formId: ROLE_ASSIGN_FORM_ID,
            fields: createRoleAssignFormFields(t),
          },
          {
            formId: SUPER_ADMIN_FORM_ID,
            fields: createSuperAdminFormFields(t),
          },
        ],
        actions: [
          // Form-based actions — executors handle validate + API call + toast
          {
            actionKey: 'createUser',
            label: t('UserMgmt.action.createUser', '创建用户'),
            description: t('UserMgmt.action.createUserDesc', '创建新用户'),
            formId: USER_FORM_ID,
            mode: 'create',
            execute: createUserExecutor(t),
          },
          {
            actionKey: 'editUser',
            label: t('UserMgmt.action.editUser', '编辑用户'),
            description: t('UserMgmt.action.editUserDesc', '编辑用户姓名'),
            formId: USER_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('UserMgmt.userId', '用户ID'),
                type: 'text',
                required: true,
                description: t(
                  'UserMgmt.action.editUserIdDesc',
                  '要编辑的用户ID，从表格数据中获取',
                ),
              },
              {
                name: 'name',
                label: t('UserMgmt.name', '姓名'),
                type: 'text',
                required: true,
              },
            ],
            execute: updateUserExecutor(t),
          },
          // Param-based actions — executors validate params + API call + toast
          {
            actionKey: 'toggleStatus',
            label: t('UserMgmt.action.toggleStatus', '切换用户状态'),
            description: t(
              'UserMgmt.action.toggleStatusDesc',
              '启用或禁用指定用户。不能修改自己的状态。',
            ),
            params: createToggleStatusParams(t),
            execute: toggleUserStatusExecutor(t),
          },
          {
            actionKey: 'resetPassword',
            label: t('UserMgmt.action.resetPassword', '重置用户密码'),
            description: t(
              'UserMgmt.action.resetPasswordDesc',
              '为指定用户设置新密码。',
            ),
            params: createResetPasswordParams(t),
            execute: resetPasswordExecutor(t),
          },
          {
            actionKey: 'unlockUser',
            label: t('UserMgmt.action.unlockUser', '解锁用户'),
            description: t(
              'UserMgmt.action.unlockUserDesc',
              '解锁被锁定的用户。仅超级管理员可执行。',
            ),
            params: createUnlockUserParams(t),
            execute: unlockUserExecutor(t),
          },
          {
            actionKey: 'assignRoles',
            label: t('UserMgmt.action.assignRoles', '分配角色'),
            description: t(
              'UserMgmt.action.assignRolesDesc',
              '为指定用户分配角色。需要传入角色ID数组。',
            ),
            params: createAssignRolesParams(t),
            execute: assignRolesExecutor(t),
          },
          {
            actionKey: 'createSuperAdmin',
            label: t('UserMgmt.action.createSuperAdmin', '创建超级管理员'),
            description: t(
              'UserMgmt.action.createSuperAdminDesc',
              '创建超级管理员账户。仅超级管理员可执行。',
            ),
            formId: SUPER_ADMIN_FORM_ID,
            mode: 'create',
            execute: createSuperAdminExecutor(t),
          },
        ],
      };
    }, [t]),
  );
};
