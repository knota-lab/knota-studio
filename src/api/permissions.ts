import { del, get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type {
  PermissionResponse,
  PermissionsWithMetadataResponse,
  SyncPermissionsRequest,
  UpdatePermissionRequest,
} from '@/types/permission';

export const listPermissions = (params?: {
  page?: number;
  pageSize?: number;
}) => get<PaginatedResponse<PermissionResponse>>('/permissions', { params });

export const getPermissionsWithMetadata = () =>
  get<PermissionsWithMetadataResponse>('/permissions/with-metadata');

export const syncPermissions = (data: SyncPermissionsRequest) =>
  post<PermissionResponse[]>('/permissions/sync', data);

export const updatePermission = (id: string, data: UpdatePermissionRequest) =>
  put<PermissionResponse>(`/permissions/${id}`, data);

export const deletePermission = (id: string) => del(`/permissions/${id}`);
