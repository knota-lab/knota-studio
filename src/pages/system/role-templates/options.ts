import {
  createRoleTemplate,
  deleteRoleTemplate,
  syncTemplateMenus,
  syncTemplatePermissions,
  updateRoleTemplate,
} from '@/api/role-templates';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const ROLE_TEMPLATE_TABLE_ID = 'system_role_templates_list';

export function createRoleTemplateTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('RoleTemplateMgmt.templateName', '模板名称'),
      size: 160,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t('RoleTemplateMgmt.templateNameDesc', '角色模板名称'),
      search: {
        type: 'text',
        placeholder: t(
          'RoleTemplateMgmt.templateNamePlaceholder',
          '搜索模板名称',
        ),
      },
    },
    {
      key: 'code',
      label: t('RoleTemplateMgmt.code', '模板编码'),
      size: 140,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t('RoleTemplateMgmt.codeDesc', '角色模板唯一编码'),
      search: {
        type: 'text',
        placeholder: t('RoleTemplateMgmt.codePlaceholder', '搜索模板编码'),
      },
    },
    {
      key: 'description',
      label: t('RoleTemplateMgmt.description', '描述'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('RoleTemplateMgmt.descriptionDesc', '模板描述'),
    },
    {
      key: 'isDefault',
      label: t('RoleTemplateMgmt.isDefault', '默认模板'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('RoleTemplateMgmt.isDefaultDesc', '是否为默认模板'),
    },
    {
      key: 'sortOrder',
      label: t('RoleTemplateMgmt.sortOrder', '排序'),
      size: 80,
      minSize: 60,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('RoleTemplateMgmt.sortOrderDesc', '显示排序号'),
    },
    {
      key: 'actions',
      label: t('RoleTemplateMgmt.actions', '操作'),
      size: 280,
      minSize: 200,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('RoleTemplateMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// biome-ignore lint/style/useNamingConvention: global constant
export const ROLE_TEMPLATE_FORM_ID = 'role_template_create_edit';

/** Fields for creating a new role template */
export function createRoleTemplateCreateFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'code',
      label: t('RoleTemplateMgmt.code', '模板编码'),
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      label: t('RoleTemplateMgmt.templateName', '模板名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('RoleTemplateMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
    {
      name: 'isDefault',
      label: t('RoleTemplateMgmt.isDefault', '默认模板'),
      type: 'boolean',
    },
    {
      name: 'sortOrder',
      label: t('RoleTemplateMgmt.sortOrder', '排序'),
      type: 'number',
    },
  ];
}

/** Fields for editing an existing role template (no code) */
export function createRoleTemplateEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('RoleTemplateMgmt.templateName', '模板名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('RoleTemplateMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
    {
      name: 'isDefault',
      label: t('RoleTemplateMgmt.isDefault', '默认模板'),
      type: 'boolean',
    },
    {
      name: 'sortOrder',
      label: t('RoleTemplateMgmt.sortOrder', '排序'),
      type: 'number',
    },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

/** Params for deleteRoleTemplate action. */
export function createDeleteRoleTemplateParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'templateId',
      label: t('RoleTemplateMgmt.templateId', '模板ID'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.deleteTemplateIdDesc',
        '要删除的角色模板 ID',
      ),
    },
  ];
}

/** Params for assignMenus action. */
export function createAssignMenusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'templateId',
      label: t('RoleTemplateMgmt.templateId', '模板ID'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.assignMenusTemplateIdDesc',
        '要分配菜单的角色模板ID',
      ),
    },
    {
      name: 'menuIds',
      label: t('RoleTemplateMgmt.menuIds', '菜单ID列表'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.menuIdsDesc',
        '要分配的系统菜单ID，逗号分隔',
      ),
    },
  ];
}

/** Params for assignPermissions action. */
export function createAssignPermissionsParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'templateId',
      label: t('RoleTemplateMgmt.templateId', '模板ID'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.assignPermsTemplateIdDesc',
        '要分配权限的角色模板ID',
      ),
    },
    {
      name: 'permissions',
      label: t('RoleTemplateMgmt.permissions', '权限列表'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.permissionsDesc',
        '要分配的权限，格式: obj:act,逗号分隔',
      ),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export { getPermissionsWithMetadata } from '@/api/permissions';
export {
  getTemplateMenuIds,
  getTemplatePermissions,
  listRoleTemplates,
} from '@/api/role-templates';
export { getSysMenuTree } from '@/api/sys-menu';
export {
  createRoleTemplate,
  deleteRoleTemplate,
  syncTemplateMenus,
  syncTemplatePermissions,
  updateRoleTemplate,
};

// ─── Validated Executors ──────────────────────────────────────
export function createRoleTemplateExecutor(t: TFn) {
  return validatedFormAction(
    createRoleTemplateCreateFields(t),
    t,
    async (v) =>
      createRoleTemplate({
        code: v.code as string,
        name: v.name as string,
        description: v.description as string | undefined,
        isDefault: v.isDefault as boolean,
        sortOrder: v.sortOrder as number | undefined,
      }),
    t('RoleTemplateMgmt.toast.created', '角色模板创建成功'),
  );
}

export function updateRoleTemplateExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('RoleTemplateMgmt.templateId', '模板ID'),
        type: 'text',
        required: true,
      },
      {
        name: 'name',
        label: t('RoleTemplateMgmt.templateName', '模板名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'description',
        label: t('RoleTemplateMgmt.description', '描述'),
        type: 'textarea',
      },
      {
        name: 'isDefault',
        label: t('RoleTemplateMgmt.isDefault', '默认模板'),
        type: 'boolean',
      },
      {
        name: 'sortOrder',
        label: t('RoleTemplateMgmt.sortOrder', '排序'),
        type: 'number',
      },
    ],
    t,
    async (v) =>
      updateRoleTemplate(v.id as string, {
        name: v.name as string,
        description: v.description as string | undefined,
        isDefault: v.isDefault as boolean,
        sortOrder: v.sortOrder as number | undefined,
      }),
    t('RoleTemplateMgmt.toast.updated', '角色模板更新成功'),
  );
}

export function deleteRoleTemplateExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteRoleTemplateParams(t),
    t,
    async (v) => deleteRoleTemplate(v.templateId as string),
    t('RoleTemplateMgmt.toast.deleted', '角色模板删除成功'),
  );
}

export function assignTemplateMenusExecutor(t: TFn) {
  return validatedParamAction(
    createAssignMenusParams(t),
    t,
    async (v) => {
      const ids = (v.sysMenuIds as string).split(',').map((s) => s.trim());
      await syncTemplateMenus(v.templateId as string, { sysMenuIds: ids });
    },
    t('RoleTemplateMgmt.toast.menusAssigned', '菜单分配成功'),
  );
}

export function assignTemplatePermissionsExecutor(t: TFn) {
  return validatedParamAction(
    createAssignPermissionsParams(t),
    t,
    async (v) => {
      const perms = (v.permissions as string).split(',').map((s) => {
        const [obj, act] = s.trim().split(':');
        return { obj, act };
      });
      await syncTemplatePermissions(v.templateId as string, {
        permissions: perms,
      });
    },
    t('RoleTemplateMgmt.toast.permsAssigned', '权限分配成功'),
  );
}

// ─── Agent Query Actions ────────────────────────────────────────

/** Params for listAssignablePermissions query action (role-templates). */
export function createListAssignablePermissionsParams(
  t: TFn,
): PageActionParam[] {
  return [
    {
      name: 'templateId',
      label: t('RoleTemplateMgmt.templateId', '模板ID'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.listPermsTemplateIdDesc',
        '要查询的角色模板ID',
      ),
    },
    {
      name: 'search',
      label: t('RoleTemplateMgmt.searchPerms', '搜索关键词'),
      type: 'string',
      required: false,
      description: t(
        'RoleTemplateMgmt.searchPermsDesc',
        '按描述、接口路径或分组标签搜索权限',
      ),
    },
  ];
}

/** Query executor: return all permissions with the template's current assignments. */
export function listAssignablePermissionsExecutor(_t: TFn) {
  return async (params: Record<string, unknown>) => {
    const { getPermissionsWithMetadata } = await import('@/api/permissions');
    const { getTemplatePermissions } = await import('@/api/role-templates');
    const templateId = params.templateId as string;
    const search = (params.search as string)?.toLowerCase().trim();

    const [allPerms, assigned] = await Promise.all([
      getPermissionsWithMetadata(),
      getTemplatePermissions(templateId),
    ]);

    const assignedKeys = assigned.map((p) => `${p.obj}:${p.act}`);

    let permissions = allPerms.permissions;
    if (search) {
      permissions = permissions.filter(
        (p) =>
          (p.description ?? '').toLowerCase().includes(search) ||
          (p.name ?? '').toLowerCase().includes(search) ||
          p.act.toLowerCase().includes(search) ||
          p.obj.toLowerCase().includes(search) ||
          p.tag.toLowerCase().includes(search),
      );
    }

    return { permissions, assignedKeys };
  };
}

/** Params for listAssignableMenus query action (role-templates). */
export function createListAssignableMenusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'templateId',
      label: t('RoleTemplateMgmt.templateId', '模板ID'),
      type: 'string',
      required: true,
      description: t(
        'RoleTemplateMgmt.listMenusTemplateIdDesc',
        '要查询的角色模板ID',
      ),
    },
    {
      name: 'search',
      label: t('RoleTemplateMgmt.searchMenus', '搜索关键词'),
      type: 'string',
      required: false,
      description: t(
        'RoleTemplateMgmt.searchMenusDesc',
        '按菜单名称或编码搜索菜单节点',
      ),
    },
  ];
}

/** Query executor: return full menu tree with the template's current assignments. */
export function listAssignableMenusExecutor(_t: TFn) {
  return async (params: Record<string, unknown>) => {
    const { getSysMenuTree } = await import('@/api/sys-menu');
    const { getTemplateMenuIds } = await import('@/api/role-templates');
    const templateId = params.templateId as string;
    const search = (params.search as string)?.toLowerCase().trim() ?? '';

    const [tree, menuIds] = await Promise.all([
      getSysMenuTree(),
      getTemplateMenuIds(templateId),
    ]);

    const assigned = menuIds.sysMenuIds;

    if (!search) {
      return { menus: tree, assignedMenuIds: assigned };
    }

    function filterTree(menus: typeof tree): typeof tree {
      return menus
        .map((menu) => {
          const selfMatch =
            menu.name.toLowerCase().includes(search) ||
            menu.code.toLowerCase().includes(search) ||
            assigned.includes(menu.id);

          const filteredChildren =
            menu.children.length > 0 ? filterTree(menu.children) : [];

          if (filteredChildren.length > 0 || selfMatch) {
            return {
              ...menu,
              children: selfMatch ? menu.children : filteredChildren,
            };
          }
          return null;
        })
        .filter((m): m is (typeof tree)[number] => m !== null);
    }

    return { menus: filterTree(tree), assignedMenuIds: assigned };
  };
}
