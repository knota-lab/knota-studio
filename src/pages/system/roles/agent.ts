import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  assignMenusExecutor,
  assignPermissionsExecutor,
  createAssignMenusParams,
  createAssignPermissionsParams,
  createListAssignableMenusParams,
  createListAssignablePermissionsParams,
  createRoleExecutor,
  createRoleFormFields,
  createRoleTableColumns,
  createToggleStatusParams,
  listAssignableMenusExecutor,
  listAssignablePermissionsExecutor,
  listRoles,
  ROLE_FORM_ID,
  ROLE_TABLE_ID,
  toggleRoleStatusExecutor,
  updateRoleExecutor,
} from './options';

export const useRolesAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/roles',
          pageKey: 'system_roles',
          title: t('RoleMgmt.title', '角色管理'),
          intent: 'list',
          description: t(
            'RoleMgmt.titleDesc',
            '管理角色，包括创建、编辑、禁用、分配权限、分配菜单等操作',
          ),
        },
        tables: [
          {
            tableId: ROLE_TABLE_ID,
            columns: [...createRoleTableColumns(t)],
            filterFields: extractFilterFields(createRoleTableColumns(t)),
            loader: async (params) => {
              const resp = await listRoles({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: ROLE_FORM_ID,
            fields: createRoleFormFields(t),
          },
        ],
        actions: [
          {
            actionKey: 'createRole',
            label: t('RoleMgmt.action.createRole', '创建角色'),
            description: t('RoleMgmt.action.createRoleDesc', '创建新角色'),
            formId: ROLE_FORM_ID,
            mode: 'create',
            execute: createRoleExecutor(t),
          },
          {
            actionKey: 'editRole',
            label: t('RoleMgmt.action.editRole', '编辑角色'),
            description: t(
              'RoleMgmt.action.editRoleDesc',
              '编辑角色名称和描述',
            ),
            formId: ROLE_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('RoleMgmt.roleId', '角色ID'),
                type: 'text',
                required: true,
                description: t('RoleMgmt.roleIdToEditDesc', '要编辑的角色ID'),
              },
              {
                name: 'name',
                label: t('RoleMgmt.roleName', '角色名称'),
                type: 'text',
                required: true,
              },
              {
                name: 'description',
                label: t('RoleMgmt.description', '描述'),
                type: 'text',
              },
              {
                name: 'version',
                label: t('RoleMgmt.version', '版本号'),
                type: 'number',
                required: true,
                description: t('RoleMgmt.versionDesc', '乐观锁版本号'),
              },
            ],
            execute: updateRoleExecutor(t),
          },
          {
            actionKey: 'toggleStatus',
            label: t('RoleMgmt.action.toggleStatus', '切换角色状态'),
            description: t(
              'RoleMgmt.action.toggleStatusDesc',
              '启用或禁用指定角色',
            ),
            params: createToggleStatusParams(t),
            execute: toggleRoleStatusExecutor(t),
          },
          {
            actionKey: 'assignPermissions',
            label: t('RoleMgmt.action.assignPerms', '分配权限'),
            description: t(
              'RoleMgmt.action.assignPermsDesc',
              '为指定角色分配权限',
            ),
            params: createAssignPermissionsParams(t),
            execute: assignPermissionsExecutor(t),
          },
          {
            actionKey: 'assignMenus',
            label: t('RoleMgmt.action.assignMenus', '分配菜单'),
            description: t(
              'RoleMgmt.action.assignMenusDesc',
              '为指定角色分配菜单',
            ),
            params: createAssignMenusParams(t),
            execute: assignMenusExecutor(t),
          },
          {
            actionKey: 'listAssignablePermissions',
            label: t('RoleMgmt.action.listAssignablePerms', '查询可分配权限'),
            description: t(
              'RoleMgmt.action.listAssignablePermsDesc',
              '查询指定角色可分配的权限列表，支持按描述/路径搜索。用于在分配前了解有哪些权限可选。',
            ),
            params: createListAssignablePermissionsParams(t),
            query: true,
            execute: listAssignablePermissionsExecutor(t),
          },
          {
            actionKey: 'listAssignableMenus',
            label: t('RoleMgmt.action.listAssignableMenus', '查询可分配菜单'),
            description: t(
              'RoleMgmt.action.listAssignableMenusDesc',
              '查询指定角色可分配的菜单树，支持按名称/编码搜索。用于在分配前了解有哪些菜单可选。',
            ),
            params: createListAssignableMenusParams(t),
            query: true,
            execute: listAssignableMenusExecutor(t),
          },
        ],
      }),
      [t],
    ),
  );
};
