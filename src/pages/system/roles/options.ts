import {
  createRole,
  syncRoleMenus,
  syncRolePermissions,
  toggleRoleStatus,
  updateRole,
} from '@/api/roles';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// ─── Table: Role List ───────────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const ROLE_TABLE_ID = 'system_roles_list';

export function createRoleTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('RoleMgmt.roleName', '角色名称'),
      size: 140,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t('RoleMgmt.roleNameDesc', '角色名称'),
      search: {
        type: 'text',
        placeholder: t('RoleMgmt.roleNamePlaceholder', '搜索角色名称'),
        order: 1,
      },
    },
    {
      key: 'code',
      label: t('RoleMgmt.code', '角色编码'),
      size: 140,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('RoleMgmt.codeDesc', '角色唯一编码'),
    },
    {
      key: 'tenantName',
      label: t('RoleMgmt.tenant', '所属租户'),
      size: 120,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('RoleMgmt.tenantDesc', '所属租户名称'),
    },
    {
      key: 'isSystem',
      label: t('RoleMgmt.type', '类型'),
      size: 100,
      minSize: 80,
      maxSize: 120,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('RoleMgmt.typeDesc', '系统角色或自定义角色'),
    },
    {
      key: 'status',
      label: t('RoleMgmt.status', '状态'),
      size: 120,
      minSize: 100,
      maxSize: 140,
      align: 'center',
      filterable: true,
      sortable: false,
      description: t('RoleMgmt.statusDesc', '角色启用/禁用状态'),
      search: {
        type: 'select',
        options: [
          { value: 'active', label: t('RoleMgmt.badge.enabled', '启用') },
          { value: 'disabled', label: t('RoleMgmt.badge.disabled', '禁用') },
        ],
        order: 2,
      },
    },
    {
      key: 'description',
      label: t('RoleMgmt.description', '描述'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('RoleMgmt.descriptionDesc', '角色描述'),
    },
    {
      key: 'actions',
      label: t('RoleMgmt.actions', '操作'),
      size: 280,
      minSize: 240,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('RoleMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── Form: Role Create/Edit ─────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const ROLE_FORM_ID = 'role_create_edit';

export function createRoleFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('RoleMgmt.roleName', '角色名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'code',
      label: t('RoleMgmt.code', '角色编码'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('RoleMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

export function createRoleEditFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('RoleMgmt.roleName', '角色名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('RoleMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

export function createToggleStatusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'roleId',
      label: t('RoleMgmt.roleId', '角色ID'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.roleIdDesc', '目标角色的 ID'),
    },
    {
      name: 'status',
      label: t('RoleMgmt.status', '状态'),
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: t('RoleMgmt.badge.enabled', '启用') },
        { value: 'disabled', label: t('RoleMgmt.badge.disabled', '禁用') },
      ],
      description: t('RoleMgmt.statusToSetDesc', '要设置的状态'),
    },
  ];
}

export function createAssignPermissionsParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'roleId',
      label: t('RoleMgmt.roleId', '角色ID'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.roleIdDesc', '目标角色的 ID'),
    },
    {
      name: 'permissionIds',
      label: t('RoleMgmt.permissionIds', '权限ID列表'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.permissionIdsDesc', '要分配的权限 ID 数组'),
    },
  ];
}

export function createAssignMenusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'roleId',
      label: t('RoleMgmt.roleId', '角色ID'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.roleIdDesc', '目标角色的 ID'),
    },
    {
      name: 'sysMenuIds',
      label: t('RoleMgmt.menuIds', '菜单ID列表'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.menuIdsDesc', '要分配的菜单 ID 数组'),
    },
  ];
}

export { getErrorMessage } from '@/api/errorMap';
export {
  getAssignableMenus,
  getAssignablePermissions,
  listRoles,
} from '@/api/roles';
// ─── API Re-exports ────────────────────────────────────────────
export { getAllTenants } from '@/api/tenants';
export {
  createRole,
  syncRoleMenus,
  syncRolePermissions,
  toggleRoleStatus,
  updateRole,
};

// ─── Validated Executors ──────────────────────────────────────
export function createRoleExecutor(t: TFn) {
  return validatedFormAction(
    createRoleFormFields(t),
    t,
    async (v) =>
      createRole({
        name: v.name as string,
        code: v.code as string,
        description: v.description as string | undefined,
      }),
    t('RoleMgmt.toast.created', '角色创建成功'),
  );
}

export function updateRoleExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('RoleMgmt.roleId', '角色ID'),
        type: 'text',
        required: true,
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
      },
    ],
    t,
    async (v) =>
      updateRole(v.id as string, {
        name: v.name as string,
        description: v.description as string | null,
        version: v.version as number,
      }),
    t('RoleMgmt.toast.updated', '角色更新成功'),
  );
}

export function toggleRoleStatusExecutor(t: TFn) {
  return validatedParamAction(
    createToggleStatusParams(t),
    t,
    async (v) =>
      toggleRoleStatus(v.roleId as string, v.status as 'active' | 'disabled'),
    t('RoleMgmt.toast.statusUpdated', '状态更新成功'),
  );
}

export function assignPermissionsExecutor(t: TFn) {
  return validatedParamAction(
    createAssignPermissionsParams(t),
    t,
    async (v) => {
      const ids = (v.permissionIds as string).split(',').map((s) => s.trim());
      await syncRolePermissions(v.roleId as string, ids);
    },
    t('RoleMgmt.toast.permsAssigned', '权限分配成功'),
  );
}

export function assignMenusExecutor(t: TFn) {
  return validatedParamAction(
    createAssignMenusParams(t),
    t,
    async (v) => {
      const ids = (v.sysMenuIds as string).split(',').map((s) => s.trim());
      await syncRoleMenus(v.roleId as string, ids);
    },
    t('RoleMgmt.toast.menusAssigned', '菜单分配成功'),
  );
}

// ─── Agent Query Actions ────────────────────────────────────────

/** Params for listAssignablePermissions query action. */
export function createListAssignablePermissionsParams(
  t: TFn,
): PageActionParam[] {
  return [
    {
      name: 'roleId',
      label: t('RoleMgmt.roleId', '角色ID'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.roleIdDesc', '目标角色的 ID'),
    },
    {
      name: 'search',
      label: t('RoleMgmt.searchPerms', '搜索关键词'),
      type: 'string',
      required: false,
      description: t(
        'RoleMgmt.searchPermsDesc',
        '按描述、接口路径或分组标签搜索权限',
      ),
    },
  ];
}

/** Query executor that returns filtered permission list for the agent. */
export function listAssignablePermissionsExecutor(_t: TFn) {
  return async (params: Record<string, unknown>) => {
    const { getAssignablePermissions } = await import('@/api/roles');
    const roleId = params.roleId as string;
    const search = (params.search as string)?.toLowerCase().trim();

    const data = await getAssignablePermissions(roleId);
    if (!search) return data;

    return {
      ...data,
      permissions: data.permissions.filter(
        (p) =>
          (p.description ?? '').toLowerCase().includes(search) ||
          (p.name ?? '').toLowerCase().includes(search) ||
          p.act.toLowerCase().includes(search) ||
          p.obj.toLowerCase().includes(search) ||
          p.tag.toLowerCase().includes(search),
      ),
    };
  };
}

/** Params for listAssignableMenus query action. */
export function createListAssignableMenusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'roleId',
      label: t('RoleMgmt.roleId', '角色ID'),
      type: 'string',
      required: true,
      description: t('RoleMgmt.roleIdDesc', '目标角色的 ID'),
    },
    {
      name: 'search',
      label: t('RoleMgmt.searchMenus', '搜索关键词'),
      type: 'string',
      required: false,
      description: t(
        'RoleMgmt.searchMenusDesc',
        '按菜单名称或编码搜索菜单节点',
      ),
    },
  ];
}

/** Query executor that returns filtered menu tree for the agent. */
export function listAssignableMenusExecutor(_t: TFn) {
  return async (params: Record<string, unknown>) => {
    const { getAssignableMenus } = await import('@/api/roles');
    const roleId = params.roleId as string;
    const search = (params.search as string)?.toLowerCase().trim() ?? '';

    const data = await getAssignableMenus(roleId);
    if (!search) return data;

    /** Recursively filter menu tree, keeping ancestors of matching nodes. */
    function filterMenus(menus: typeof data.menus): typeof data.menus {
      return menus
        .map((menu) => {
          const selfMatch =
            menu.name.toLowerCase().includes(search) ||
            menu.code.toLowerCase().includes(search) ||
            data.assignedMenuIds.includes(menu.id);

          const filteredChildren =
            menu.children.length > 0 ? filterMenus(menu.children) : [];

          if (filteredChildren.length > 0 || selfMatch) {
            return {
              ...menu,
              children: selfMatch ? menu.children : filteredChildren,
            };
          }
          return null;
        })
        .filter((m): m is (typeof data.menus)[number] => m !== null);
    }

    return { ...data, menus: filterMenus(data.menus) };
  };
}
