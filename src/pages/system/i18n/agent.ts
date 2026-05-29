import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import type { LocaleAdmin } from './options';
import {
  batchUpdateParams,
  batchUpdateTranslationsExecutor,
  clearTenantOverrideExecutor,
  createDeleteEntryParams,
  createDeleteLocaleParams,
  createDeleteTranslationParams,
  createKeyTableActionsColumn,
  createKeyTableFixedColumns,
  createLocaleExecutor,
  createLocaleFormFields,
  createLocaleTableColumns,
  createTenantOverrideColumns,
  deleteEntryExecutor,
  deleteLocaleExecutor,
  deleteTranslationExecutor,
  KEY_TABLE_ID,
  LOCALE_FORM_ID,
  LOCALE_TABLE_ID,
  listCurrentTenantKeys,
  listGlobalKeys,
  listLocales,
  TENANT_OVERRIDE_TABLE_ID,
  updateLocaleExecutor,
} from './options';

export const useI18nAgent = (locales: LocaleAdmin[] = []) => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/i18n',
          pageKey: 'system_i18n',
          title: t('I18nMgmt.title', '国际化管理'),
          intent: 'list',
          description: t(
            'I18nMgmt.titleDesc',
            '管理语言、全局翻译和租户覆盖翻译',
          ),
        },
        tables: [
          {
            tableId: LOCALE_TABLE_ID,
            columns: [...createLocaleTableColumns(t)],
            filterFields: extractFilterFields(createLocaleTableColumns(t)),
            loader: async () => {
              const resp = await listLocales();
              return resp;
            },
          },
          {
            tableId: KEY_TABLE_ID,
            columns: [
              ...createKeyTableFixedColumns(t),
              createKeyTableActionsColumn(t),
            ],
            filterFields: [
              ...extractFilterFields(createKeyTableFixedColumns(t)),
              {
                name: 'emptyLocale',
                label: t('I18n.KeyTable.filter.emptyLocale', '缺少翻译的语言'),
                type: 'select',
                description: t(
                  'I18n.KeyTable.filter.emptyLocaleDesc',
                  '筛选指定语言翻译为空的条目',
                ),
                options: locales.map((l) => ({
                  value: l.locale,
                  label: `${l.locale} ${l.label}`,
                })),
              },
            ],
            loader: async (params) => {
              const resp = await listGlobalKeys({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
                namespace: params.namespace as string | undefined,
                q: params.q as string | undefined,
                emptyLocale: params.emptyLocale as string | undefined,
              });
              return resp;
            },
          },
          {
            tableId: TENANT_OVERRIDE_TABLE_ID,
            columns: [...createTenantOverrideColumns(t)],
            filterFields: [
              ...extractFilterFields(createTenantOverrideColumns(t)),
              {
                name: 'emptyLocale',
                label: t('I18n.KeyTable.filter.emptyLocale', '缺少翻译的语言'),
                type: 'select',
                description: t(
                  'I18n.KeyTable.filter.emptyLocaleDesc',
                  '筛选指定语言翻译为空的条目',
                ),
                options: locales.map((l) => ({
                  value: l.locale,
                  label: `${l.locale} ${l.label}`,
                })),
              },
            ],
            loader: async (params) => {
              const resp = await listCurrentTenantKeys({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
                namespace: params.namespace as string | undefined,
                q: params.q as string | undefined,
                emptyLocale: params.emptyLocale as string | undefined,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: LOCALE_FORM_ID,
            fields: createLocaleFormFields(t),
          },
        ],
        actions: [
          {
            actionKey: 'createLocale',
            label: t('I18nMgmt.action.createLocale', '新建语言'),
            description: t(
              'I18nMgmt.action.createLocaleDesc',
              '创建新的语言配置',
            ),
            formId: LOCALE_FORM_ID,
            mode: 'create',
            fields: createLocaleFormFields(t),
            execute: createLocaleExecutor(t),
          },
          {
            actionKey: 'editLocale',
            label: t('I18nMgmt.action.editLocale', '编辑语言'),
            description: t('I18nMgmt.action.editLocaleDesc', '编辑语言配置'),
            formId: LOCALE_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'locale',
                label: t('I18nMgmt.locale', '语言代码'),
                type: 'text',
                required: true,
                description: t('I18nMgmt.localeEditDesc', '要编辑的语言代码'),
              },
              ...createLocaleFormFields(t).slice(1),
            ],
            execute: updateLocaleExecutor(t),
          },
          {
            actionKey: 'deleteLocale',
            label: t('I18nMgmt.action.deleteLocale', '删除语言'),
            description: t(
              'I18nMgmt.action.deleteLocaleDesc',
              '删除指定的语言配置',
            ),
            params: createDeleteLocaleParams(t),
            execute: deleteLocaleExecutor(t),
          },
          {
            actionKey: 'deleteTranslation',
            label: t('I18nMgmt.action.deleteTranslation', '删除翻译'),
            description: t(
              'I18nMgmt.action.deleteTranslationDesc',
              '删除指定的翻译值',
            ),
            params: createDeleteTranslationParams(t),
            execute: deleteTranslationExecutor(t),
          },
          {
            actionKey: 'deleteEntry',
            label: t('I18nMgmt.action.deleteEntry', '删除条目'),
            description: t('I18nMgmt.action.deleteEntryDesc', '删除翻译条目'),
            params: createDeleteEntryParams(t),
            execute: deleteEntryExecutor(t),
          },
          {
            actionKey: 'clearTenantOverride',
            label: t('I18nMgmt.action.clearTenantOverride', '清空租户覆盖'),
            description: t(
              'I18nMgmt.action.clearTenantOverrideDesc',
              '清空指定翻译的租户覆盖值',
            ),
            params: [
              {
                name: 'translationId',
                label: t('I18nMgmt.column.translationId', '翻译ID'),
                type: 'string',
                required: true,
                description: t(
                  'I18nMgmt.column.translationIdDesc',
                  '要清空的翻译行ID',
                ),
              },
            ],
            execute: clearTenantOverrideExecutor(t),
          },
          {
            actionKey: 'batchUpdateTranslations',
            label: t('I18nMgmt.action.batchUpdate', '批量更新翻译'),
            description: t(
              'I18nMgmt.action.batchUpdateDesc',
              '批量更新多个翻译条目。传入 entries 数组（每项包含 namespace、key、locale、value）和可选的 scope（global/tenant）。',
            ),
            params: batchUpdateParams,
            execute: batchUpdateTranslationsExecutor(t),
          },
        ],
      }),
      [t, locales],
    ),
  );
};
