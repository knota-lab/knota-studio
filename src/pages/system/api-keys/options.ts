import {
  changeApiKeyRole,
  createExchangeToken,
  revokeApiKey,
  updateApiKey,
} from '@/api/api-keys';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';
import type { PageActionParam } from '@/stores/agent';

// ─── Table: API Key List ──────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const API_KEY_TABLE_ID = 'system_api_keys_list';

export function createApiKeyTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('ApiKeyMgmt.column.name', '名称'),
      size: 140,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.nameDesc', 'API Key 名称'),
    },
    {
      key: 'keyPrefix',
      label: t('ApiKeyMgmt.column.keyPrefix', 'Key 前缀'),
      size: 120,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.keyPrefixDesc', '密钥前缀'),
    },
    {
      key: 'roleName',
      label: t('ApiKeyMgmt.column.role', '角色'),
      size: 120,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.roleDesc', '关联角色'),
    },
    {
      key: 'status',
      label: t('ApiKeyMgmt.column.status', '状态'),
      size: 100,
      minSize: 80,
      maxSize: 120,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.statusDesc', '密钥状态'),
    },
    {
      key: 'lastUsedAt',
      label: t('ApiKeyMgmt.column.lastUsedAt', '最后使用'),
      size: 160,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.lastUsedAtDesc', '最后使用时间'),
    },
    {
      key: 'expiresAt',
      label: t('ApiKeyMgmt.column.expiresAt', '过期时间'),
      size: 160,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.expiresAtDesc', '过期时间'),
    },
    {
      key: 'createdAt',
      label: t('ApiKeyMgmt.column.createdAt', '创建时间'),
      size: 160,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.createdAtDesc', '创建时间'),
    },
    {
      key: 'actions',
      label: t('ApiKeyMgmt.column.actions', '操作'),
      size: 260,
      minSize: 220,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.actionsDesc', '可执行的操作'),
    },
  ];
}

// ─── Table: Exchange Token List ───────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const EXCHANGE_TOKEN_TABLE_ID = 'system_exchange_tokens_list';

export function createExchangeTokenTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'name',
      label: t('ApiKeyMgmt.column.name', '名称'),
      size: 140,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.tokenNameDesc', '兑换令牌名称'),
    },
    {
      key: 'tokenPrefix',
      label: t('ApiKeyMgmt.column.keyPrefix', 'Key 前缀'),
      size: 120,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.tokenPrefixDesc', '令牌前缀'),
    },
    {
      key: 'roleName',
      label: t('ApiKeyMgmt.column.role', '角色'),
      size: 120,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.roleDesc', '关联角色'),
    },
    {
      key: 'usage',
      label: t('ApiKeyMgmt.column.usage', '使用次数'),
      size: 100,
      minSize: 80,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.usageDesc', '已使用/最大使用次数'),
    },
    {
      key: 'expiresAt',
      label: t('ApiKeyMgmt.column.validUntil', '有效期至'),
      size: 160,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.validUntilDesc', '令牌有效期截止时间'),
    },
    {
      key: 'createdAt',
      label: t('ApiKeyMgmt.column.createdAt', '创建时间'),
      size: 160,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('ApiKeyMgmt.column.createdAtDesc', '创建时间'),
    },
  ];
}

// ─── Form: Edit API Key ───────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const EDIT_API_KEY_FORM_ID = 'api_key_edit';

export function createEditApiKeyFormFields(t: TFn): FieldConfig[] {
  return [
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
  ];
}

// ─── Form: Change Role ────────────────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const CHANGE_ROLE_FORM_ID = 'api_key_change_role';

export function createChangeRoleFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'roleId',
      label: t('ApiKeyMgmt.column.role', '角色'),
      type: 'select',
      required: true,
    },
  ];
}

// ─── Form: Create Exchange Token ──────────────────────────────

// biome-ignore lint/style/useNamingConvention: global constant
export const CREATE_EXCHANGE_TOKEN_FORM_ID = 'exchange_token_create';

export function createExchangeTokenFormFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('ApiKeyMgmt.column.name', '名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'roleId',
      label: t('ApiKeyMgmt.column.role', '角色'),
      type: 'select',
      required: true,
    },
    {
      name: 'maxUsage',
      label: t('ApiKeyMgmt.field.maxUsage', '最大使用次数'),
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      name: 'apiKeyExpiresAt',
      label: t('ApiKeyMgmt.field.apiKeyExpiresAt', '密钥过期时间'),
      type: 'datetime',
      description: t(
        'ApiKeyMgmt.field.apiKeyExpiresAtDesc',
        '兑换后生成的 API Key 过期时间，留空则永久有效',
      ),
    },
    {
      name: 'description',
      label: t('ApiKeyMgmt.field.description', '描述'),
      type: 'textarea',
    },
  ];
}

// ─── Page Actions ─────────────────────────────────────────────

export function createRevokeApiKeyParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'apiKeyId',
      label: t('ApiKeyMgmt.field.apiKeyId', 'API Key ID'),
      type: 'string',
      required: true,
      description: t('ApiKeyMgmt.field.apiKeyIdDesc', '要吊销的 API Key ID'),
    },
  ];
}

export function createChangeRoleParams(t: TFn): PageActionParam[] {
  return [
    {
      name: 'apiKeyId',
      label: t('ApiKeyMgmt.field.apiKeyId', 'API Key ID'),
      type: 'string',
      required: true,
      description: t('ApiKeyMgmt.field.apiKeyIdDesc', '要吊销的 API Key ID'),
    },
    {
      name: 'roleId',
      label: t('ApiKeyMgmt.column.role', '角色'),
      type: 'string',
      required: true,
      description: t('ApiKeyMgmt.field.targetRoleIdDesc', '要更换的角色 ID'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export type {
  ApiKeyResponse,
  CreateExchangeTokenResponse,
} from '@/api/api-keys';
export {
  getApiKeys,
  getExchangeTokens,
} from '@/api/api-keys';

import { listRoles } from '@/api/roles';

export {
  changeApiKeyRole,
  createExchangeToken,
  listRoles,
  revokeApiKey,
  updateApiKey,
};

// ─── Validated Executors ──────────────────────────────────────
export function updateApiKeyExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('ApiKeyMgmt.field.apiKeyId', 'API Key ID'),
        type: 'text',
        required: true,
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
    t,
    async (v) =>
      updateApiKey(v.id as string, {
        name: v.name as string,
        description: v.description as string | undefined,
      }),
    t('ApiKeyMgmt.toast.updated', 'API Key 更新成功'),
  );
}

export function changeApiKeyRoleExecutor(t: TFn) {
  return validatedParamAction(
    createChangeRoleParams(t),
    t,
    async (v) => changeApiKeyRole(v.apiKeyId as string, v.roleId as string),
    t('ApiKeyMgmt.toast.roleChanged', '角色更换成功'),
  );
}

export function revokeApiKeyExecutor(t: TFn) {
  return validatedParamAction(
    createRevokeApiKeyParams(t),
    t,
    async (v) => revokeApiKey(v.apiKeyId as string),
    t('ApiKeyMgmt.toast.revoked', 'API Key 已吊销'),
  );
}

export function createExchangeTokenExecutor(t: TFn) {
  return validatedFormAction(
    createExchangeTokenFormFields(t),
    t,
    async (v) =>
      createExchangeToken({
        name: v.name as string,
        roleId: v.roleId as string,
        description: v.description as string | undefined,
        apiKeyExpiresAt: v.apiKeyExpiresAt as string | undefined,
        maxUsage: v.maxUsage as number | undefined,
      }),
    t('ApiKeyMgmt.toast.tokenCreated', 'Token 创建成功'),
  );
}
