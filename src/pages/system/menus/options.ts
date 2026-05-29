import { deleteMenuOverride, upsertMenuOverride } from '@/api/menu';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const TENANT_MENU_TABLE_ID = 'system_menus_list';

export function createMenuTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('MenuMgmt.menuName', '菜单名'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('MenuMgmt.menuNameDesc', '菜单名称'),
    },
    {
      key: 'code',
      label: t('MenuMgmt.menuCode', '菜单编号'),
      size: 140,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('MenuMgmt.menuCodeDesc', '菜单唯一编码'),
    },
    {
      key: 'type',
      label: t('MenuMgmt.type', '类型'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('MenuMgmt.typeDesc', '菜单类型：目录/菜单/按钮'),
    },
    {
      key: 'sortOrder',
      label: t('MenuMgmt.sortOrder', '排序'),
      size: 80,
      minSize: 60,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('MenuMgmt.sortOrderDesc', '显示排序号'),
    },
    {
      key: 'actions',
      label: t('MenuMgmt.actions', '操作'),
      size: 160,
      minSize: 120,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('MenuMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// biome-ignore lint/style/useNamingConvention: global constant
export const MENU_OVERRIDE_FORM_ID = 'menu_override';

export function createMenuOverrideFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'customName',
      label: t('MenuMgmt.customName', '自定义名称'),
      type: 'text',
    },
    {
      name: 'customIcon',
      label: t('MenuMgmt.customIcon', '自定义图标'),
      type: 'icon',
    },
    {
      name: 'customSort',
      label: t('MenuMgmt.customSort', '自定义排序'),
      type: 'number',
    },
    {
      name: 'isHidden',
      label: t('MenuMgmt.isHidden', '是否隐藏'),
      type: 'boolean',
    },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

/** Params for deleteMenuOverride (reset to default) action. */
export function createResetMenuParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'sysMenuId',
      label: t('MenuMgmt.menuId', '菜单ID'),
      type: 'string',
      required: true,
      description: t('MenuMgmt.menuIdResetDesc', '要恢复默认的系统菜单 ID'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export { getTenantMenuTree } from '@/api/menu';
export { deleteMenuOverride, upsertMenuOverride };

// ─── Validated Executors ──────────────────────────────────────
export function overrideMenuExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'sysMenuId',
        label: t('MenuMgmt.menuId', '菜单ID'),
        type: 'text',
        required: true,
      },
      ...createMenuOverrideFormFields(t),
    ],
    t,
    async (v) =>
      upsertMenuOverride(v.sysMenuId as string, {
        customName: (v.customName as string) || null,
        customIcon: (v.customIcon as string) || null,
        customSort: v.customSort as number | null,
        isHidden: v.isHidden as boolean,
      }),
    t('MenuMgmt.toast.overrideSaved', '自定义成功'),
  );
}

export function resetMenuExecutor(t: TFn) {
  return validatedParamAction(
    createResetMenuParams(t),
    t,
    async (v) => deleteMenuOverride(v.sysMenuId as string),
    t('MenuMgmt.toast.resetSuccess', '恢复默认成功'),
  );
}
