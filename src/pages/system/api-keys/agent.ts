import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  API_KEY_TABLE_ID,
  CHANGE_ROLE_FORM_ID,
  CREATE_EXCHANGE_TOKEN_FORM_ID,
  changeApiKeyRoleExecutor,
  createApiKeyTableColumns,
  createChangeRoleFormFields,
  createChangeRoleParams,
  createEditApiKeyFormFields,
  createExchangeTokenExecutor,
  createExchangeTokenFormFields,
  createExchangeTokenTableColumns,
  createRevokeApiKeyParams,
  EDIT_API_KEY_FORM_ID,
  EXCHANGE_TOKEN_TABLE_ID,
  getApiKeys,
  getExchangeTokens,
  revokeApiKeyExecutor,
  updateApiKeyExecutor,
} from './options';

export const useApiKeysAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/api-keys',
          pageKey: 'system_api_keys',
          title: t('ApiKeyMgmt.title', 'API 密钥管理'),
          intent: 'list',
          description: t(
            'ApiKeyMgmt.meta.description',
            '管理 API 密钥和兑换令牌，包括编辑、吊销、换绑角色、创建兑换令牌等操作',
          ),
        },
        tables: [
          {
            tableId: API_KEY_TABLE_ID,
            columns: [...createApiKeyTableColumns(t)],
            filterFields: extractFilterFields(createApiKeyTableColumns(t)),
            loader: async (params) => {
              const resp = await getApiKeys({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
          {
            tableId: EXCHANGE_TOKEN_TABLE_ID,
            columns: [...createExchangeTokenTableColumns(t)],
            filterFields: extractFilterFields(
              createExchangeTokenTableColumns(t),
            ),
            loader: async (params) => {
              const resp = await getExchangeTokens({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: EDIT_API_KEY_FORM_ID,
            fields: createEditApiKeyFormFields(t),
          },
          {
            formId: CHANGE_ROLE_FORM_ID,
            fields: createChangeRoleFormFields(t),
          },
          {
            formId: CREATE_EXCHANGE_TOKEN_FORM_ID,
            fields: createExchangeTokenFormFields(t),
          },
        ],
        actions: [
          {
            actionKey: 'editApiKey',
            label: t('ApiKeyMgmt.action.edit', '编辑 API Key'),
            description: t(
              'ApiKeyMgmt.action.editDesc',
              '编辑 API Key 名称和描述',
            ),
            formId: EDIT_API_KEY_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('ApiKeyMgmt.field.apiKeyId', 'API Key ID'),
                type: 'text',
                required: true,
                description: t(
                  'ApiKeyMgmt.field.apiKeyIdDesc',
                  '要吊销的 API Key ID',
                ),
              },
              {
                name: 'name',
                label: t('ApiKeyMgmt.column.name', '名称'),
                type: 'text',
                required: true,
              },
              {
                name: 'description',
                label: t('ApiKeyMgmt.field.description', '描述'),
                type: 'textarea',
              },
            ],
            execute: updateApiKeyExecutor(t),
          },
          {
            actionKey: 'changeRole',
            label: t('ApiKeyMgmt.action.changeRole', '换绑角色'),
            description: t(
              'ApiKeyMgmt.action.changeRoleDesc',
              '更换 API Key 绑定的角色',
            ),
            params: createChangeRoleParams(t),
            execute: changeApiKeyRoleExecutor(t),
          },
          {
            actionKey: 'revokeApiKey',
            label: t('ApiKeyMgmt.action.revoke', '吊销 API Key'),
            description: t(
              'ApiKeyMgmt.action.revokeDesc',
              '吊销指定的 API Key，吊销后不可恢复',
            ),
            params: createRevokeApiKeyParams(t),
            execute: revokeApiKeyExecutor(t),
          },
          {
            actionKey: 'createExchangeToken',
            label: t('ApiKeyMgmt.action.createToken', '创建兑换令牌'),
            description: t(
              'ApiKeyMgmt.action.createTokenDesc',
              '创建新的兑换令牌',
            ),
            formId: CREATE_EXCHANGE_TOKEN_FORM_ID,
            mode: 'create',
            execute: createExchangeTokenExecutor(t),
          },
        ],
      }),
      [t],
    ),
  );
};
