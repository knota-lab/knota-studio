import { createSysMenu, deleteSysMenu, updateSysMenu } from '@/api/sys-menu';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const SYS_MENU_TABLE_ID = 'system_sys_menus_list';

// biome-ignore lint/style/useNamingConvention: global constant
export const SYS_MENU_FORM_ID = 'sys_menu_create_edit';

export function createSysMenuTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('SysMenuMgmt.menuName', '菜单名'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.menuNameDesc', '菜单名称'),
    },
    {
      key: 'code',
      label: t('SysMenuMgmt.menuCode', '菜单编号'),
      size: 140,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.menuCodeDesc', '菜单唯一编码'),
    },
    {
      key: 'type',
      label: t('SysMenuMgmt.type', '类型'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.typeDesc', '菜单类型：目录/菜单/按钮'),
    },
    {
      key: 'path',
      label: t('SysMenuMgmt.path', '路由地址'),
      size: 160,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.pathDesc', '前端路由地址'),
    },
    {
      key: 'alias',
      label: t('SysMenuMgmt.alias', '权限标识'),
      size: 160,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.aliasDesc', '权限标识'),
    },
    {
      key: 'sortOrder',
      label: t('SysMenuMgmt.sortOrder', '排序'),
      size: 80,
      minSize: 60,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.sortOrderDesc', '显示排序号'),
    },
    {
      key: 'status',
      label: t('SysMenuMgmt.status', '状态'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.statusDesc', '启用/禁用状态'),
    },
    {
      key: 'isCache',
      label: t('SysMenuMgmt.cache', '缓存'),
      size: 80,
      minSize: 60,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.cacheDesc', '是否缓存路由'),
    },
    {
      key: 'actions',
      label: t('SysMenuMgmt.actions', '操作'),
      size: 160,
      minSize: 120,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysMenuMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

export function createSysMenuCreateFields(t: TFn): FieldConfig[] {
  const menuTypeOptions = [
    { value: 'directory', label: t('SysMenuMgmt.typeDirectory', '目录') },
    { value: 'menu', label: t('SysMenuMgmt.typeMenu', '菜单') },
    { value: 'button', label: t('SysMenuMgmt.typeButton', '按钮') },
  ];

  const baseFields: FieldConfig[] = [
    {
      name: 'name',
      label: t('SysMenuMgmt.menuNameLabel', '菜单名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      label: t('SysMenuMgmt.menuTypeLabel', '菜单类型'),
      type: 'select',
      required: true,
      options: menuTypeOptions,
    },
    {
      name: 'path',
      label: t('SysMenuMgmt.pathLabel', '路由地址'),
      type: 'text',
    },
    {
      name: 'alias',
      label: t('SysMenuMgmt.aliasLabel', '权限标识'),
      type: 'text',
    },
    { name: 'icon', label: t('SysMenuMgmt.icon', '图标'), type: 'icon' },
    {
      name: 'sortOrder',
      label: t('SysMenuMgmt.sortOrderLabel', '排序'),
      type: 'number',
    },
    {
      name: 'isCache',
      label: t('SysMenuMgmt.isCache', '是否缓存'),
      type: 'boolean',
    },
  ];

  return [
    {
      name: 'code',
      label: t('SysMenuMgmt.menuCodeLabel', '菜单编号'),
      type: 'text',
      required: true,
    },
    {
      name: 'parentId',
      label: t('SysMenuMgmt.parentMenu', '上级菜单'),
      type: 'tree-select' as const,
      placeholder: t(
        'SysMenuMgmt.parentMenuPlaceholder',
        '选择上级菜单（留空=顶层菜单）',
      ),
    },
    ...baseFields,
    {
      name: 'remark',
      label: t('SysMenuMgmt.remark', '备注'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

export function createSysMenuEditFields(t: TFn): FieldConfig[] {
  const menuTypeOptions = [
    { value: 'directory', label: t('SysMenuMgmt.typeDirectory', '目录') },
    { value: 'menu', label: t('SysMenuMgmt.typeMenu', '菜单') },
    { value: 'button', label: t('SysMenuMgmt.typeButton', '按钮') },
  ];

  const statusOptions = [
    { value: 'active', label: t('SysMenuMgmt.badge.enabled', '启用') },
    { value: 'disabled', label: t('SysMenuMgmt.badge.disabled', '禁用') },
  ];

  const baseFields: FieldConfig[] = [
    {
      name: 'name',
      label: t('SysMenuMgmt.menuNameLabel', '菜单名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      label: t('SysMenuMgmt.menuTypeLabel', '菜单类型'),
      type: 'select',
      required: true,
      options: menuTypeOptions,
    },
    {
      name: 'path',
      label: t('SysMenuMgmt.pathLabel', '路由地址'),
      type: 'text',
    },
    {
      name: 'alias',
      label: t('SysMenuMgmt.aliasLabel', '权限标识'),
      type: 'text',
    },
    { name: 'icon', label: t('SysMenuMgmt.icon', '图标'), type: 'icon' },
    {
      name: 'sortOrder',
      label: t('SysMenuMgmt.sortOrderLabel', '排序'),
      type: 'number',
    },
    {
      name: 'isCache',
      label: t('SysMenuMgmt.isCache', '是否缓存'),
      type: 'boolean',
    },
  ];

  return [
    ...baseFields,
    {
      name: 'parentId',
      label: t('SysMenuMgmt.parentMenu', '上级菜单'),
      type: 'tree-select' as const,
      placeholder: t(
        'SysMenuMgmt.parentMenuPlaceholder',
        '选择上级菜单（留空=顶层菜单）',
      ),
    },
    {
      name: 'status',
      label: t('SysMenuMgmt.status', '状态'),
      type: 'select',
      options: statusOptions,
    },
    {
      name: 'remark',
      label: t('SysMenuMgmt.remark', '备注'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

/** Factory for deleteSysMenu action params. */
export function createDeleteSysMenuParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'menuId',
      label: t('SysMenuMgmt.menuId', '菜单ID'),
      type: 'string',
      required: true,
      description: t('SysMenuMgmt.menuIdDesc', '要删除的菜单 ID'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export { getSysMenuTree } from '@/api/sys-menu';
export { createSysMenu, deleteSysMenu, updateSysMenu };

// ─── Validated Executors ──────────────────────────────────────
export function createSysMenuExecutor(t: TFn) {
  return validatedFormAction(
    createSysMenuCreateFields(t),
    t,
    async (v) =>
      createSysMenu({
        name: v.name as string,
        code: v.code as string,
        type: v.type as string,
        parentId: (v.parentId as string) || null,
        path: (v.path as string) || null,
        alias: (v.alias as string) || null,
        icon: (v.icon as string) || null,
        sortOrder: v.sortOrder as number,
        isCache: v.isCache as boolean,
        remark: (v.remark as string) || null,
      }),
    t('SysMenuMgmt.toast.created', '创建成功'),
  );
}

export function updateSysMenuExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('SysMenuMgmt.menuId', '菜单ID'),
        type: 'text',
        required: true,
      },
      {
        name: 'version',
        label: t('SysMenuMgmt.version', '版本号'),
        type: 'number',
        required: true,
      },
      ...createSysMenuEditFields(t),
    ],
    t,
    async (v) =>
      updateSysMenu(v.id as string, {
        name: v.name as string,
        type: v.type as string,
        parentId: (v.parentId as string) || null,
        path: (v.path as string) || null,
        alias: (v.alias as string) || null,
        icon: (v.icon as string) || null,
        sortOrder: v.sortOrder as number,
        isCache: v.isCache as boolean,
        status: v.status as string,
        remark: (v.remark as string) || null,
        version: v.version as number,
      }),
    t('SysMenuMgmt.toast.updated', '更新成功'),
  );
}

export function deleteSysMenuExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteSysMenuParams(t),
    t,
    async (v) => deleteSysMenu(v.menuId as string),
    t('SysMenuMgmt.toast.deleted', '删除成功'),
  );
}
