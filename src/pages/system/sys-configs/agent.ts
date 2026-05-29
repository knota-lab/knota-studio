import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  createConfigExecutor,
  createDeleteOverrideParams,
  createDeleteSysConfigParams,
  createSysConfigCreateFields,
  createSysConfigEditFields,
  createSysConfigTableColumns,
  createUpsertOverrideParams,
  deleteConfigExecutor,
  deleteOverrideExecutor,
  listGlobalConfigs,
  SYS_CONFIG_FORM_ID,
  SYS_CONFIG_TABLE_ID,
  updateConfigExecutor,
  upsertOverrideExecutor,
} from './options';

/**
 * Register the SysConfigs page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useSysConfigsAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/sys-configs',
          pageKey: 'system_sys_configs',
          title: t('SysConfigMgmt.title', '配置中心'),
          intent: 'list',
          description: t(
            'SysConfigMgmt.titleDesc',
            '管理系统配置项的增删改查，支持全局配置管理和租户覆盖',
          ),
        },
        tables: [
          {
            tableId: SYS_CONFIG_TABLE_ID,
            columns: [...createSysConfigTableColumns(t)],
            filterFields: extractFilterFields(createSysConfigTableColumns(t)),
            loader: async (params) => {
              const resp = await listGlobalConfigs({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: SYS_CONFIG_FORM_ID,
            fields: createSysConfigCreateFields(t),
          },
        ],
        actions: [
          {
            actionKey: 'createConfig',
            label: t('SysConfigMgmt.action.createConfig', '创建配置'),
            description: t(
              'SysConfigMgmt.action.createConfigDesc',
              '创建新的全局配置项',
            ),
            formId: SYS_CONFIG_FORM_ID,
            mode: 'create',
            fields: createSysConfigCreateFields(t),
            execute: createConfigExecutor(t),
          },
          {
            actionKey: 'editConfig',
            label: t('SysConfigMgmt.action.editConfig', '编辑配置'),
            description: t(
              'SysConfigMgmt.action.editConfigDesc',
              '编辑全局配置项',
            ),
            formId: SYS_CONFIG_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'key',
                label: t('SysConfigMgmt.configKey', '配置键'),
                type: 'text',
                required: true,
                description: t(
                  'SysConfigMgmt.configKeyEditDesc',
                  '要编辑的配置项键名，从表格数据中获取',
                ),
              },
              ...createSysConfigEditFields(t),
            ],
            execute: updateConfigExecutor(t),
          },
          {
            actionKey: 'deleteConfig',
            label: t('SysConfigMgmt.action.deleteConfig', '删除配置'),
            description: t(
              'SysConfigMgmt.action.deleteConfigDesc',
              '删除指定的全局配置项',
            ),
            params: createDeleteSysConfigParams(t),
            execute: deleteConfigExecutor(t),
          },
          {
            actionKey: 'upsertOverride',
            label: t('SysConfigMgmt.action.upsertOverride', '创建/更新覆盖'),
            description: t(
              'SysConfigMgmt.action.upsertOverrideDesc',
              '为当前租户创建或更新配置覆盖值',
            ),
            params: createUpsertOverrideParams(t),
            execute: upsertOverrideExecutor(t),
          },
          {
            actionKey: 'deleteOverride',
            label: t('SysConfigMgmt.action.deleteOverride', '删除覆盖'),
            description: t(
              'SysConfigMgmt.action.deleteOverrideDesc',
              '删除当前租户的配置覆盖值',
            ),
            params: createDeleteOverrideParams(t),
            execute: deleteOverrideExecutor(t),
          },
        ],
      }),
      [t],
    ),
  );
};
