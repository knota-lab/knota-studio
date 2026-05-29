import { del, get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateGlobalConfigRequest,
  SysConfigResponse,
  UpdateGlobalConfigRequest,
} from '@/types/sys-config';

// ─── Global Config Management ──────────────────────────────

export const listGlobalConfigs = (params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  prefix?: string;
}) => get<PaginatedResponse<SysConfigResponse>>('/sys-configs', { params });

export const createGlobalConfig = (data: CreateGlobalConfigRequest) =>
  post<SysConfigResponse>('/sys-configs', data);

export const updateGlobalConfig = (
  key: string,
  data: UpdateGlobalConfigRequest,
) => put<SysConfigResponse>(`/sys-configs/${key}`, data);

export const deleteGlobalConfig = (key: string) => del(`/sys-configs/${key}`);

// ─── Tenant Override (for future use) ──────────────────────

export const listTenantOverrides = (params?: {
  category?: string;
  prefix?: string;
}) => get<SysConfigResponse[]>('/sys-configs/overrides', { params });

export const upsertTenantOverride = (key: string, data: { value: string }) =>
  put<void>(`/sys-configs/${key}/override`, data);

export const deleteTenantOverride = (key: string) =>
  del(`/sys-configs/${key}/override`);
