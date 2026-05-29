import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import {
  assignTemplateMenusExecutor,
  assignTemplatePermissionsExecutor,
  createAssignMenusParams,
  createAssignPermissionsParams,
  createDeleteRoleTemplateParams,
  createListAssignableMenusParams,
  createListAssignablePermissionsParams,
  createRoleTemplateCreateFields,
  createRoleTemplateEditFields,
  createRoleTemplateExecutor,
  createRoleTemplateTableColumns,
  deleteRoleTemplateExecutor,
  listAssignableMenusExecutor,
  listAssignablePermissionsExecutor,
  listRoleTemplates,
  ROLE_TEMPLATE_FORM_ID,
  ROLE_TEMPLATE_TABLE_ID,
  updateRoleTemplateExecutor,
} from './options';

/**
 * Register the RoleTemplates page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useRoleTemplatesAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const columns = createRoleTemplateTableColumns(t);
      const createFields = createRoleTemplateCreateFields(t);
      const editFields = createRoleTemplateEditFields(t);
      const deleteParams = createDeleteRoleTemplateParams(t);
      const assignMenusParams = createAssignMenusParams(t);
      const assignPermsParams = createAssignPermissionsParams(t);

      return {
        meta: {
          route: '/system/role-templates',
          pageKey: 'system_role_templates',
          title: t('RoleTemplateMgmt.title', '角色模板管理'),
          intent: 'list',
          description: t(
            'RoleTemplateMgmt.titleDesc',
            '管理角色模板的增删改查，包括模板创建、编辑、删除以及菜单和权限分配',
          ),
        },
        tables: [
          {
            tableId: ROLE_TEMPLATE_TABLE_ID,
            columns: [...columns],
            filterFields: extractFilterFields(columns),
            loader: async () => {
              const resp = await listRoleTemplates();
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: ROLE_TEMPLATE_FORM_ID,
            fields: createFields,
          },
        ],
        actions: [
          {
            actionKey: 'createRoleTemplate',
            label: t('RoleTemplateMgmt.dialog.create', '创建角色模板'),
            description: t(
              'RoleTemplateMgmt.dialog.createDesc',
              '创建新的角色模板',
            ),
            formId: ROLE_TEMPLATE_FORM_ID,
            mode: 'create',
            fields: createFields,
            execute: createRoleTemplateExecutor(t),
          },
          {
            actionKey: 'editRoleTemplate',
            label: t('RoleTemplateMgmt.dialog.edit', '编辑角色模板'),
            description: t(
              'RoleTemplateMgmt.dialog.editDesc',
              '编辑角色模板信息',
            ),
            formId: ROLE_TEMPLATE_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('RoleTemplateMgmt.templateId', '模板ID'),
                type: 'text',
                required: true,
                description: t(
                  'RoleTemplateMgmt.editTemplateIdDesc',
                  '要编辑的角色模板ID，从表格数据中获取',
                ),
              },
              ...editFields,
            ],
            execute: updateRoleTemplateExecutor(t),
          },
          {
            actionKey: 'deleteRoleTemplate',
            label: t('RoleTemplateMgmt.action.delete', '删除角色模板'),
            description: t(
              'RoleTemplateMgmt.action.deleteDesc',
              '删除指定的角色模板',
            ),
            params: deleteParams,
            execute: deleteRoleTemplateExecutor(t),
          },
          {
            actionKey: 'assignMenus',
            label: t('RoleTemplateMgmt.action.assignMenus', '分配菜单'),
            description: t(
              'RoleTemplateMgmt.action.assignMenusDesc',
              '为角色模板分配系统菜单',
            ),
            params: assignMenusParams,
            execute: assignTemplateMenusExecutor(t),
          },
          {
            actionKey: 'assignPermissions',
            label: t('RoleTemplateMgmt.action.assignPermissions', '分配权限'),
            description: t(
              'RoleTemplateMgmt.action.assignPermissionsDesc',
              '为角色模板分配权限',
            ),
            params: assignPermsParams,
            execute: assignTemplatePermissionsExecutor(t),
          },
          {
            actionKey: 'listAssignablePermissions',
            label: t(
              'RoleTemplateMgmt.action.listAssignablePerms',
              '查询可分配权限',
            ),
            description: t(
              'RoleTemplateMgmt.action.listAssignablePermsDesc',
              '查询角色模板可分配的全部权限及当前已分配的权限，支持按描述/路径搜索。用于在分配前了解有哪些权限可选。',
            ),
            params: createListAssignablePermissionsParams(t),
            query: true,
            execute: listAssignablePermissionsExecutor(t),
          },
          {
            actionKey: 'listAssignableMenus',
            label: t(
              'RoleTemplateMgmt.action.listAssignableMenus',
              '查询可分配菜单',
            ),
            description: t(
              'RoleTemplateMgmt.action.listAssignableMenusDesc',
              '查询角色模板可分配的全部菜单树及当前已分配的菜单，支持按名称/编码搜索。用于在分配前了解有哪些菜单可选。',
            ),
            params: createListAssignableMenusParams(t),
            query: true,
            execute: listAssignableMenusExecutor(t),
          },
        ],
      };
    }, [t]),
  );
};
