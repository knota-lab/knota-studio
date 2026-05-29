import { z } from 'zod';
import {
  batchUpdateGlobalTranslations,
  batchUpdateTenantOverrides,
  createLocale,
  deleteCurrentTenantOverride,
  deleteEntry,
  deleteGlobalTranslation,
  deleteLocale,
  updateGlobalTranslation,
  updateLocale,
  upsertGlobalTranslation,
} from '@/api/i18n-admin';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';
import { toast } from '@/utils/toast';

// biome-ignore lint/style/useNamingConvention: global constant
export const LOCALE_TABLE_ID = 'system_i18n_locales';

export function createLocaleTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'locale',
      label: t('I18nMgmt.locale', '语言代码'),
      size: 140,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t('I18nMgmt.localeDesc', '语言唯一标识，如 en, zh-CN'),
      search: {
        type: 'text',
        placeholder: t('I18nMgmt.localePlaceholder', '搜索语言代码'),
      },
    },
    {
      key: 'label',
      label: t('I18nMgmt.label', '显示名称'),
      size: 160,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t(
        'I18nMgmt.labelDesc',
        '语言的显示名称，如 English, 简体中文',
      ),
      search: {
        type: 'text',
        placeholder: t('I18nMgmt.labelPlaceholder', '搜索显示名称'),
      },
    },
    {
      key: 'isEnabled',
      label: t('I18nMgmt.isEnabled', '启用'),
      size: 80,
      minSize: 60,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('I18nMgmt.isEnabledDesc', '是否启用该语言'),
    },
    {
      key: 'sortOrder',
      label: t('I18nMgmt.sortOrder', '排序'),
      size: 80,
      minSize: 60,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('I18nMgmt.sortOrderDesc', '排序权重'),
    },
    {
      key: 'actions',
      label: t('I18nMgmt.actions', '操作'),
      size: 160,
      minSize: 120,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('I18nMgmt.actionsDesc', '可执行的操作'),
    },
  ];
}

// biome-ignore lint/style/useNamingConvention: global constant
export const LOCALE_FORM_ID = 'i18n_locale_edit';

export function createLocaleFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'locale',
      label: t('I18nMgmt.locale', '语言代码'),
      type: 'text',
      required: true,
      description: t('I18nMgmt.localeFormDesc', '如 en, zh-CN'),
    },
    {
      name: 'label',
      label: t('I18nMgmt.label', '显示名称'),
      type: 'text',
      required: true,
      description: t('I18nMgmt.labelFormDesc', '如 English, 简体中文'),
    },
    {
      name: 'isEnabled',
      label: t('I18nMgmt.isEnabled', '启用'),
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'sortOrder',
      label: t('I18nMgmt.sortOrder', '排序'),
      type: 'number',
      defaultValue: 0,
    },
  ];
}

// biome-ignore lint/style/useNamingConvention: global constant
export const KEY_TABLE_ID = 'system_i18n_keys';

export function createKeyTableFixedColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'namespace',
      label: t('I18nMgmt.namespace', '命名空间'),
      size: 140,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t('I18nMgmt.namespaceDesc', '翻译键所属的命名空间'),
      search: {
        type: 'text',
        placeholder: t('I18nMgmt.namespacePlaceholder', '搜索命名空间'),
      },
    },
    {
      key: 'key',
      label: t('I18nMgmt.key', '键'),
      size: 180,
      minSize: 120,
      filterable: true,
      sortable: false,
      description: t('I18nMgmt.keyDesc', '翻译键'),
      search: {
        type: 'text',
        placeholder: t('I18nMgmt.keyPlaceholder', '搜索键'),
      },
    },
  ];
}

export function createKeyTableActionsColumn(t: TFn): ColumnOption {
  return {
    key: 'actions',
    label: t('I18nMgmt.actions', '操作'),
    size: 160,
    minSize: 120,
    enableResizing: false,
    align: 'center',
    filterable: false,
    sortable: false,
    description: t('I18nMgmt.actionsDesc', '可执行的操作'),
  };
}

// biome-ignore lint/style/useNamingConvention: global constant
export const KEY_FORM_ID = 'i18n_translation_edit';

export function createTranslationEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'namespace',
      label: t('I18nMgmt.namespace', '命名空间'),
      type: 'text',
      required: true,
      description: t(
        'I18nMgmt.namespaceReadOnlyDesc',
        '翻译键所属的命名空间（只读）',
      ),
    },
    {
      name: 'key',
      label: t('I18nMgmt.key', '键'),
      type: 'text',
      required: true,
      description: t('I18nMgmt.keyReadOnlyDesc', '翻译键（只读）'),
    },
    {
      name: 'locale',
      label: t('I18nMgmt.localeSelect', '语言'),
      type: 'select',
      required: true,
      description: t('I18nMgmt.localeSelectDesc', '要编辑的语言'),
    },
    {
      name: 'value',
      label: t('I18nMgmt.value', '翻译值'),
      type: 'textarea',
      required: true,
    },
  ];
}

// ─── Page Actions ───────────────────────────────────────────────

export function createDeleteLocaleParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'locale',
      label: t('I18nMgmt.locale', '语言代码'),
      type: 'string',
      required: true,
      description: t('I18nMgmt.localeDeleteDesc', '要删除的语言代码'),
    },
  ];
}

export function createDeleteTranslationParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'translationId',
      label: t('I18nMgmt.translationId', '翻译ID'),
      type: 'string',
      required: true,
      description: t('I18nMgmt.translationIdDeleteDesc', '要删除的翻译 ID'),
    },
  ];
}

export function createDeleteEntryParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'entryId',
      label: t('I18nMgmt.entryId', '条目ID'),
      type: 'string',
      required: true,
      description: t('I18nMgmt.entryIdDeleteDesc', '要删除的翻译条目 ID'),
    },
  ];
}

// ─── Tenant Override Table ──────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const TENANT_OVERRIDE_TABLE_ID = 'system_i18n_tenant_overrides';

export function createTenantOverrideColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'namespace',
      label: t('I18nMgmt.column.namespace', '命名空间'),
      size: 160,
      filterable: true,
      sortable: false,
      description: t('I18nMgmt.column.namespaceDesc', '翻译命名空间'),
      search: {
        type: 'text',
        placeholder: t('I18nMgmt.column.namespacePlaceholder', '搜索命名空间'),
      },
    },
    {
      key: 'key',
      label: t('I18nMgmt.column.key', '键'),
      size: 160,
      filterable: true,
      sortable: false,
      description: t('I18nMgmt.column.keyDesc', '翻译键'),
      search: {
        type: 'text',
        placeholder: t('I18nMgmt.column.keyPlaceholder', '搜索键'),
      },
    },
    {
      key: 'actions',
      label: t('I18nMgmt.column.actions', '操作'),
      size: 120,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('I18nMgmt.column.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export type {
  EntryLocation,
  ExportQuery,
  ImportEntry,
  ImportResponse,
  KeyEntry,
  KeyListParams,
  LocaleAdmin,
  NamespaceSummary,
} from '@/api/i18n-admin';
export {
  deleteCurrentTenantOverrideCell,
  exportCurrentTenantOverrides,
  exportGlobalTranslations,
  importCurrentTenantOverrides,
  importGlobalTranslations,
  listCurrentTenantKeys,
  listCurrentTenantNamespaces,
  listEntryLocations,
  listGlobalKeys,
  listGlobalNamespaces,
  listLocales,
} from '@/api/i18n-admin';
export {
  createLocale,
  deleteCurrentTenantOverride,
  deleteEntry,
  deleteGlobalTranslation,
  deleteLocale,
  updateGlobalTranslation,
  updateLocale,
  upsertGlobalTranslation,
};

// ─── Validated Executors ──────────────────────────────────────
export function createLocaleExecutor(t: TFn) {
  return validatedFormAction(
    createLocaleFormFields(t),
    t,
    async (v) =>
      createLocale({
        locale: v.locale as string,
        label: v.label as string,
        isEnabled: v.isEnabled as boolean,
        sortOrder: v.sortOrder as number | undefined,
      }),
    t('I18nMgmt.toast.localeCreated', '语言创建成功'),
  );
}

export function updateLocaleExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'locale',
        label: t('I18nMgmt.locale', '语言代码'),
        type: 'text',
        required: true,
      },
      {
        name: 'label',
        label: t('I18nMgmt.label', '显示名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'isEnabled',
        label: t('I18nMgmt.isEnabled', '启用'),
        type: 'boolean',
      },
      {
        name: 'sortOrder',
        label: t('I18nMgmt.sortOrder', '排序'),
        type: 'number',
      },
    ],
    t,
    async (v) =>
      updateLocale(v.locale as string, {
        label: v.label as string,
        isEnabled: v.isEnabled as boolean,
        sortOrder: v.sortOrder as number | undefined,
      }),
    t('I18nMgmt.toast.localeUpdated', '语言更新成功'),
  );
}

export function deleteLocaleExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteLocaleParams(t),
    t,
    async (v) => deleteLocale(v.locale as string),
    t('I18nMgmt.toast.localeDeleted', '语言删除成功'),
  );
}

export function editTranslationExecutor(t: TFn) {
  return validatedFormAction(
    [
      { name: 'id', label: 'ID', type: 'text' },
      {
        name: 'namespace',
        label: t('I18nMgmt.column.namespace', '命名空间'),
        type: 'text',
      },
      { name: 'key', label: t('I18nMgmt.column.key', '键'), type: 'text' },
      {
        name: 'locale',
        label: t('I18nMgmt.locale', '语言代码'),
        type: 'text',
        required: true,
      },
      { name: 'value', label: t('I18nMgmt.value', '翻译值'), type: 'text' },
    ],
    t,
    async (v) => {
      const id = v.id as string | undefined;
      if (id) {
        await updateGlobalTranslation(id, { value: v.value as string });
      } else {
        await upsertGlobalTranslation({
          namespace: v.namespace as string,
          key: v.key as string,
          locale: v.locale as string,
          value: v.value as string,
        });
      }
    },
    t('I18nMgmt.toast.translationUpdated', '翻译更新成功'),
  );
}

export function deleteTranslationExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteTranslationParams(t),
    t,
    async (v) => deleteGlobalTranslation(v.translationId as string),
    t('I18nMgmt.toast.translationDeleted', '翻译删除成功'),
  );
}

export function deleteEntryExecutor(t: TFn) {
  return validatedParamAction(
    createDeleteEntryParams(t),
    t,
    async (v) => deleteEntry(v.entryId as string),
    t('I18nMgmt.toast.entryDeleted', '条目删除成功'),
  );
}

export function clearTenantOverrideExecutor(t: TFn) {
  return validatedParamAction(
    [{ name: 'translationId', label: 'ID', type: 'string', required: true }],
    t,
    async (v) => deleteCurrentTenantOverride(v.translationId as string),
    t('I18nMgmt.toast.overrideCleared', '覆盖已清除'),
  );
}

// ─── Batch Translation ─────────────────────────────────────────

const entrySchema = z.object({
  namespace: z.string().min(1),
  key: z.string().min(1),
  locale: z.string().min(1),
  value: z.string(),
});

export const batchUpdateParams: PageActionParam[] = [
  {
    name: 'entries',
    label: '翻译条目列表',
    type: 'string',
    required: true,
    description:
      'JSON 数组，每项包含 namespace、key、locale、value 四个字段。示例: [{"namespace":"Common","key":"save","locale":"en-US","value":"Save"}]',
  },
  {
    name: 'scope',
    label: '作用域',
    type: 'select',
    required: false,
    options: [
      { value: 'global', label: '全局翻译' },
      { value: 'tenant', label: '租户翻译' },
    ],
    description: '默认为 global',
  },
];

export function batchUpdateTranslationsExecutor(t: TFn) {
  return async (values: Record<string, unknown>) => {
    const raw = values.entries;
    const scope = (values.scope as string) || 'global';

    // Parse entries — accept JSON string or already-parsed array
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(
        t('I18nMgmt.error.entriesRequired', 'entries 必须是非空数组'),
      );
    }

    const result = z.array(entrySchema).safeParse(parsed);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message).join('; ');
      throw new Error(errors);
    }

    const resp =
      scope === 'tenant'
        ? await batchUpdateTenantOverrides(result.data)
        : await batchUpdateGlobalTranslations(result.data);

    toast.success(
      t(
        'I18n.KeyTable.toast.batchUpdateSuccess',
        '已更新 {{updated}} 条，跳过 {{skipped}} 条（不存在的记录）',
        {
          updated: resp.updated,
          skipped: resp.skipped,
        },
      ),
    );
  };
}
