import {
  createGlobalConfig,
  deleteGlobalConfig,
  deleteTenantOverride,
  updateGlobalConfig,
  upsertTenantOverride,
} from '@/api/sys-configs';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const SYS_CONFIG_TABLE_ID = 'system_sys_configs_list';

// biome-ignore lint/style/useNamingConvention: global constant
export const SYS_CONFIG_FORM_ID = 'sys_config_create_edit';

// ─── Table Columns ───────────────────────────────────────────────

export function createSysConfigTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'key',
      label: t('SysConfigMgmt.configKey', '配置键'),
      size: 180,
      filterable: true,
      sortable: false,
      description: t('SysConfigMgmt.configKeyDesc', '配置项唯一键'),
    },
    {
      key: 'label',
      label: t('SysConfigMgmt.displayLabel', '显示名'),
      size: 140,
      filterable: true,
      sortable: false,
      description: t('SysConfigMgmt.displayLabelDesc', '配置项显示名称'),
    },
    {
      key: 'value',
      label: t('SysConfigMgmt.configValue', '配置值'),
      size: 160,
      filterable: false,
      sortable: false,
      description: t('SysConfigMgmt.configValueDesc', '配置项的值'),
    },
    {
      key: 'valueType',
      label: t('SysConfigMgmt.valueType', '值类型'),
      size: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t(
        'SysConfigMgmt.valueTypeDesc',
        '值的类型：string/number/boolean/json',
      ),
    },
    {
      key: 'category',
      label: t('SysConfigMgmt.category', '分类'),
      size: 100,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysConfigMgmt.categoryDesc', '配置所属分类'),
    },
    {
      key: 'scope',
      label: t('SysConfigMgmt.scope', '作用域'),
      size: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysConfigMgmt.scopeDesc', '配置作用域：global/tenant'),
    },
    {
      key: 'description',
      label: t('SysConfigMgmt.description', '描述'),
      size: 160,
      filterable: false,
      sortable: false,
      description: t('SysConfigMgmt.descriptionDesc', '配置项说明'),
    },
    {
      key: 'actions',
      label: t('SysConfigMgmt.actions', '操作'),
      size: 160,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('SysConfigMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── Form Fields ─────────────────────────────────────────────────

function createValueTypeOptions(t: TFn) {
  return [
    { value: 'string', label: t('SysConfigMgmt.valueTypeString', '字符串') },
    { value: 'number', label: t('SysConfigMgmt.valueTypeNumber', '数字') },
    { value: 'boolean', label: t('SysConfigMgmt.valueTypeBoolean', '布尔') },
    { value: 'json', label: t('SysConfigMgmt.valueTypeJson', 'JSON') },
  ];
}

export function createSysConfigCreateFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'key',
      label: t('SysConfigMgmt.configKey', '配置键'),
      type: 'text',
      required: true,
    },
    {
      name: 'label',
      label: t('SysConfigMgmt.displayLabel', '显示名'),
      type: 'text',
      required: true,
    },
    {
      name: 'value',
      label: t('SysConfigMgmt.configValue', '配置值'),
      type: 'textarea',
      required: true,
      colSpan: 2,
    },
    {
      name: 'valueType',
      label: t('SysConfigMgmt.valueType', '值类型'),
      type: 'select',
      required: true,
      options: createValueTypeOptions(t),
    },
    {
      name: 'category',
      label: t('SysConfigMgmt.category', '分类'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('SysConfigMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

export function createSysConfigEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'value',
      label: t('SysConfigMgmt.configValue', '配置值'),
      type: 'textarea',
      required: true,
      colSpan: 2,
    },
    {
      name: 'label',
      label: t('SysConfigMgmt.displayLabel', '显示名'),
      type: 'text',
    },
    {
      name: 'description',
      label: t('SysConfigMgmt.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

// ─── Page Actions ────────────────────────────────────────────────

export function createDeleteSysConfigParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'configKey',
      label: t('SysConfigMgmt.configKey', '配置键'),
      type: 'string',
      required: true,
      description: t('SysConfigMgmt.configKeyDeleteDesc', '要删除的配置项键名'),
    },
  ];
}

// ─── Tenant Override Action Params ────────────────────────────

export function createUpsertOverrideParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'configKey',
      label: t('SysConfigMgmt.configKey', '配置键'),
      type: 'string',
      required: true,
      description: t(
        'SysConfigMgmt.override.configKeyDesc',
        '要覆盖的配置项键名',
      ),
    },
    {
      name: 'value',
      label: t('SysConfigMgmt.override.overrideValue', '覆盖值'),
      type: 'string',
      required: true,
      description: t('SysConfigMgmt.override.valueDesc', '租户级别的覆盖值'),
    },
  ];
}

export function createDeleteOverrideParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'configKey',
      label: t('SysConfigMgmt.configKey', '配置键'),
      type: 'string',
      required: true,
      description: t(
        'SysConfigMgmt.override.deleteKeyDesc',
        '要删除覆盖的配置项键名',
      ),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export {
  listGlobalConfigs,
  listTenantOverrides,
} from '@/api/sys-configs';
export {
  createGlobalConfig,
  deleteGlobalConfig,
  deleteTenantOverride,
  updateGlobalConfig,
  upsertTenantOverride,
};

// ─── Validated Executors ──────────────────────────────────────
export function createConfigExecutor(t: TFn) {
  return validatedFormAction(
    createSysConfigCreateFields(t),
    t,
    async (v) =>
      createGlobalConfig({
        key: v.key as string,
        value: v.value as string,
        valueType: v.valueType as string,
        category: (v.category ?? '') as string,
        label: (v.label ?? '') as string,
        description: v.description as string | undefined,
      }),
    t('SysConfigMgmt.toast.created', '配置创建成功'),
  );
}

export function updateConfigExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'key',
        label: t('SysConfigMgmt.configKey', '配置键'),
        type: 'text',
        required: true,
      },
      {
        name: 'value',
        label: t('SysConfigMgmt.value', '配置值'),
        type: 'text',
        required: true,
      },
      { name: 'label', label: t('SysConfigMgmt.label', '标签'), type: 'text' },
      {
        name: 'description',
        label: t('SysConfigMgmt.description', '描述'),
        type: 'textarea',
      },
    ],
    t,
    async (v) =>
      updateGlobalConfig(v.key as string, {
        value: v.value as string,
        label: v.label as string | undefined,
        description: v.description as string | undefined,
      }),
    t('SysConfigMgmt.toast.updated', '配置更新成功'),
  );
}

export function deleteConfigExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteSysConfigParams(t),
    t,
    async (v) => deleteGlobalConfig(v.configKey as string),
    t('SysConfigMgmt.toast.deleted', '配置删除成功'),
  );
}

export function upsertOverrideExecutor(t: TFn) {
  return validatedParamAction(
    createUpsertOverrideParams(t),
    t,
    async (v) =>
      upsertTenantOverride(v.configKey as string, { value: v.value as string }),
    t('SysConfigMgmt.toast.overrideSaved', '覆盖保存成功'),
  );
}

export function deleteOverrideExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteOverrideParams(t),
    t,
    async (v) => deleteTenantOverride(v.configKey as string),
    t('SysConfigMgmt.toast.overrideDeleted', '覆盖删除成功'),
  );
}
