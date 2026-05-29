import {
  createDictItem,
  createDictType,
  toggleDictItemStatus,
  toggleDictTypeStatus,
  updateDictItem,
  updateDictType,
} from '@/api/dicts';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const DICT_TYPE_TABLE_ID = 'system_dict_types_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const DICT_ITEM_TABLE_ID = 'system_dict_items_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const DICT_TYPE_FORM_ID = 'dict_type_create_edit';
// biome-ignore lint/style/useNamingConvention: global constant
export const DICT_ITEM_FORM_ID = 'dict_item_create_edit';

// ─── Dict Type Table Columns ─────────────────────────────────

export function createDictTypeTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('DictMgmt.typeName', '类型名称'),
      size: 150,
      filterable: true,
      search: {
        type: 'text',
        placeholder: t('DictMgmt.typeNamePlaceholder', '搜索类型名称'),
      },
      description: t('DictMgmt.typeNameDesc', '字典类型名称'),
    },
    {
      key: 'code',
      label: t('DictMgmt.typeCode', '类型编码'),
      size: 130,
      filterable: true,
      search: {
        type: 'text',
        placeholder: t('DictMgmt.typeCodePlaceholder', '搜索类型编码'),
      },
      description: t('DictMgmt.typeCodeDesc', '字典类型唯一编码'),
    },
    {
      key: 'status',
      label: t('DictMgmt.status', '状态'),
      size: 80,
      align: 'center',
      filterable: false,
      description: t('DictMgmt.statusDesc', '启用/禁用状态'),
    },
    {
      key: 'scope',
      label: t('DictMgmt.scope', '作用域'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t('DictMgmt.scopeDesc', 'system/override/tenantOnly'),
    },
    {
      key: 'description',
      label: t('DictMgmt.description', '描述'),
      size: 150,
      filterable: false,
      description: t('DictMgmt.descriptionDesc', '类型描述'),
    },
    {
      key: 'actions',
      label: t('DictMgmt.actions', '操作'),
      size: 180,
      enableResizing: false,
      align: 'center',
      filterable: false,
      description: t('DictMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── Dict Item Table Columns ─────────────────────────────────

export function createDictItemTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('DictMgmt.itemName', '名称'),
      size: 140,
      filterable: false,
      description: t('DictMgmt.itemNameDesc', '字典项名称'),
    },
    {
      key: 'code',
      label: t('DictMgmt.itemCode', '编码'),
      size: 120,
      filterable: false,
      description: t('DictMgmt.itemCodeDesc', '字典项编码'),
    },
    {
      key: 'value',
      label: t('DictMgmt.itemValue', '值'),
      size: 120,
      filterable: false,
      description: t('DictMgmt.itemValueDesc', '字典项值'),
    },
    {
      key: 'sortOrder',
      label: t('DictMgmt.sortOrder', '排序'),
      size: 70,
      align: 'center',
      filterable: false,
      description: t('DictMgmt.sortOrderDesc', '排序号'),
    },
    {
      key: 'status',
      label: t('DictMgmt.status', '状态'),
      size: 80,
      align: 'center',
      filterable: false,
      description: t('DictMgmt.statusDesc', '启用/禁用状态'),
    },
    {
      key: 'actions',
      label: t('DictMgmt.actions', '操作'),
      size: 180,
      enableResizing: false,
      align: 'center',
      filterable: false,
      description: t('DictMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── Dict Type Form Fields ───────────────────────────────────

/** Fields for creating a new dict type (includes code) */
export function createDictTypeCreateFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'code',
      label: t('DictMgmt.typeCode', '类型编码'),
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      label: t('DictMgmt.typeName', '类型名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('DictMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

/** Fields for editing an existing dict type (no code) */
export function createDictTypeEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('DictMgmt.typeName', '类型名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('DictMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

// ─── Dict Item Form Fields ───────────────────────────────────

/** Fields for creating a new dict item (includes code, value) */
export function createDictItemCreateFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'code',
      label: t('DictMgmt.itemCode', '编码'),
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      label: t('DictMgmt.itemName', '名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'value',
      label: t('DictMgmt.itemValue', '值'),
      type: 'text',
      required: true,
    },
    {
      name: 'sortOrder',
      label: t('DictMgmt.sortOrder', '排序'),
      type: 'number',
    },
    {
      name: 'description',
      label: t('DictMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

/** Fields for editing an existing dict item (no code, value) */
export function createDictItemEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('DictMgmt.itemName', '名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'sortOrder',
      label: t('DictMgmt.sortOrder', '排序'),
      type: 'number',
    },
    {
      name: 'description',
      label: t('DictMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

// ─── Page Action Params ──────────────────────────────────────

export function createToggleDictTypeStatusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'typeId',
      label: t('DictMgmt.typeId', '类型ID'),
      type: 'string',
      required: true,
      description: t('DictMgmt.typeIdToggleDesc', '要切换状态的字典类型 ID'),
    },
    {
      name: 'version',
      label: t('DictMgmt.version', '版本号'),
      type: 'number',
      required: true,
      description: t('DictMgmt.versionDesc', '字典类型当前版本号，用于乐观锁'),
    },
  ];
}

export function createToggleDictItemStatusParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'itemId',
      label: t('DictMgmt.itemId', '字典项ID'),
      type: 'string',
      required: true,
      description: t('DictMgmt.itemIdToggleDesc', '要切换状态的字典项 ID'),
    },
    {
      name: 'version',
      label: t('DictMgmt.version', '版本号'),
      type: 'number',
      required: true,
      description: t('DictMgmt.versionDesc', '字典类型当前版本号，用于乐观锁'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export {
  getDictItemTree,
  listDictTypes,
} from '@/api/dicts';
export {
  createDictItem,
  createDictType,
  toggleDictItemStatus,
  toggleDictTypeStatus,
  updateDictItem,
  updateDictType,
};

// ─── Validated Executors ──────────────────────────────────────
export function createDictTypeExecutor(t: TFn) {
  return validatedFormAction(
    createDictTypeCreateFields(t),
    t,
    async (v) =>
      createDictType({
        code: v.code as string,
        name: v.name as string,
        description: v.description as string | undefined,
      }),
    t('DictMgmt.toast.typeCreated', '字典类型创建成功'),
  );
}

export function updateDictTypeExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('DictMgmt.typeId', '类型ID'),
        type: 'text',
        required: true,
      },
      {
        name: 'name',
        label: t('DictMgmt.typeName', '类型名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'description',
        label: t('DictMgmt.description', '描述'),
        type: 'textarea',
      },
      {
        name: 'version',
        label: t('DictMgmt.version', '版本号'),
        type: 'number',
        required: true,
      },
    ],
    t,
    async (v) =>
      updateDictType(v.id as string, {
        name: v.name as string,
        description: v.description as string | undefined,
        version: v.version as number,
      }),
    t('DictMgmt.toast.typeUpdated', '字典类型更新成功'),
  );
}

export function toggleDictTypeStatusExecutor(t: TFn) {
  return validatedParamAction(
    createToggleDictTypeStatusParams(t),
    t,
    async (v) =>
      toggleDictTypeStatus(v.typeId as string, {
        version: v.version as number,
      }),
    t('DictMgmt.toast.statusUpdated', '状态更新成功'),
  );
}

export function createDictItemExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'dictTypeId',
        label: t('DictMgmt.typeId', '类型ID'),
        type: 'text',
        required: true,
      },
      {
        name: 'code',
        label: t('DictMgmt.itemCode', '编码'),
        type: 'text',
        required: true,
      },
      {
        name: 'name',
        label: t('DictMgmt.itemName', '名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'value',
        label: t('DictMgmt.itemValue', '值'),
        type: 'text',
        required: true,
      },
      {
        name: 'sortOrder',
        label: t('DictMgmt.sortOrder', '排序'),
        type: 'number',
      },
      {
        name: 'description',
        label: t('DictMgmt.description', '描述'),
        type: 'textarea',
      },
    ],
    t,
    async (v) =>
      createDictItem({
        dictTypeId: v.dictTypeId as string,
        code: v.code as string,
        name: v.name as string,
        value: v.value as string,
        sortOrder: v.sortOrder as number | undefined,
        description: v.description as string | undefined,
      }),
    t('DictMgmt.toast.itemCreated', '字典项创建成功'),
  );
}

export function updateDictItemExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('DictMgmt.itemId', '字典项ID'),
        type: 'text',
        required: true,
      },
      ...createDictItemEditFields(t),
      {
        name: 'version',
        label: t('DictMgmt.version', '版本号'),
        type: 'number',
        required: true,
      },
    ],
    t,
    async (v) =>
      updateDictItem(v.id as string, {
        name: v.name as string,
        sortOrder: v.sortOrder as number | undefined,
        description: v.description as string | undefined,
        version: v.version as number,
      }),
    t('DictMgmt.toast.itemUpdated', '字典项更新成功'),
  );
}

export function toggleDictItemStatusExecutor(t: TFn) {
  return validatedParamAction(
    createToggleDictItemStatusParams(t),
    t,
    async (v) =>
      toggleDictItemStatus(v.itemId as string, {
        version: v.version as number,
      }),
    t('DictMgmt.toast.itemStatusUpdated', '字典项状态更新成功'),
  );
}
