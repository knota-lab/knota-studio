import { get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateSuperAdminRequest,
  CreateUserRequest,
  ListUsersParams,
  ResetPasswordRequest,
  SyncUserRolesRequest,
  ToggleStatusRequest,
  UpdateUserRequest,
  UserResponse,
  UserRolesResponse,
} from '@/types/user';

export const listUsers = (params: ListUsersParams = {}) =>
  get<PaginatedResponse<UserResponse>>('/users', { params });

export const createUser = (data: CreateUserRequest) =>
  post<UserResponse>('/users', data);

export const updateUser = (id: string, data: UpdateUserRequest) =>
  put<UserResponse>(`/users/${id}`, data);

export const toggleUserStatus = (id: string, data: ToggleStatusRequest) =>
  put<UserResponse>(`/users/${id}/status`, data);

export const resetUserPassword = (id: string, data: ResetPasswordRequest) =>
  put<UserResponse>(`/users/${id}/reset-password`, data);

export const createSuperAdmin = (data: CreateSuperAdminRequest) =>
  post<UserResponse>('/users/super-admin', data);

export const getUserRoles = (id: string) =>
  get<UserRolesResponse>(`/users/${id}/roles`);

export const syncUserRoles = (id: string, data: SyncUserRolesRequest) =>
  put<void>(`/users/${id}/roles`, data, { throwError: true });
