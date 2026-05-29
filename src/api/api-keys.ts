import { get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type { ListRolesParams, RoleResponse } from '@/types/user';

// ─── Types ────────────────────────────────────────────────────

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  roleId: string;
  roleName: string;
  description: string | null;
  exchangedFromId: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeTokenRequest {
  name: string;
  roleId: string;
  description?: string;
  expiresAt?: string;
  apiKeyExpiresAt?: string;
  maxUsage?: number;
}

export interface CreateExchangeTokenResponse {
  id: string;
  name: string;
  exchangeToken: string;
  exchangeUrl: string;
  tokenPrefix: string;
  roleId: string;
  roleName: string;
  expiresAt: string;
  maxUsage: number;
  createdAt: string;
}

export interface ExchangeTokenResponse {
  id: string;
  name: string;
  tokenPrefix: string;
  roleId: string;
  roleName: string;
  description: string | null;
  expiresAt: string;
  maxUsage: number;
  usedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Key endpoints ────────────────────────────────────────

export const getApiKeys = (params?: { page?: number; pageSize?: number }) =>
  get<PaginatedResponse<ApiKeyResponse>>('/api-keys', { params });

export const getApiKey = (id: string) => get<ApiKeyResponse>(`/api-keys/${id}`);

export const updateApiKey = (
  id: string,
  data: { name?: string; description?: string | null },
) => put<ApiKeyResponse>(`/api-keys/${id}`, data);

export const revokeApiKey = (id: string) =>
  post<ApiKeyResponse>(`/api-keys/${id}/revoke`, {});

export const changeApiKeyRole = (id: string, roleId: string) =>
  put<ApiKeyResponse>(`/api-keys/${id}/role`, { roleId });

// ─── Exchange Token endpoints ─────────────────────────────────

export const getExchangeTokens = (params?: {
  page?: number;
  pageSize?: number;
}) =>
  get<PaginatedResponse<ExchangeTokenResponse>>('/api-key-exchange-tokens', {
    params,
  });

export const createExchangeToken = (data: CreateExchangeTokenRequest) =>
  post<CreateExchangeTokenResponse>('/api-key-exchange-tokens', data);

export const getExchangeToken = (id: string) =>
  get<ExchangeTokenResponse>(`/api-key-exchange-tokens/${id}`);

// ─── Roles (for select dropdowns) ────────────────────────────

export const listAllRoles = (params: ListRolesParams = {}) =>
  get<PaginatedResponse<RoleResponse>>('/roles', { params });

// ─── Public Exchange endpoints (no auth required) ─────────────

export interface ExchangeInfoResponse {
  tenantName: string;
  roleName: string;
  expiresAt: string;
  alreadyUsed: boolean;
}

export interface ExchangeKeyResponse {
  apiKeyId: string;
  apiKey: string;
  keyPrefix: string;
  roleName: string;
  expiresAt: string | null;
  createdAt: string;
}

export const getExchangeInfo = (token: string) =>
  get<ExchangeInfoResponse>('/public/api-keys/exchange-info', {
    params: { token },
  });

export const exchangeKey = (exchangeToken: string) =>
  post<ExchangeKeyResponse>('/public/api-keys/exchange', { exchangeToken });
