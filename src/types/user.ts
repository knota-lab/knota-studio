import type { PaginationParams } from './common';

export interface UserResponse {
  id: string;
  tenantCode: string;
  tenantName: string;
  email: string;
  name: string;
  status: 'active' | 'disabled';
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  unlockAtEpoch: number | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  tenantCode?: string;
}

export interface UpdateUserRequest {
  name?: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ToggleStatusRequest {
  status: 'active' | 'disabled';
}

export interface CreateSuperAdminRequest {
  email: string;
  password: string;
  name: string;
}

export interface UserRolesResponse {
  roleIds: string[];
}

export interface SyncUserRolesRequest {
  roleIds: string[];
}

export interface RoleResponse {
  id: string;
  tenantCode: string;
  tenantName: string;
  name: string;
  code: string;
  parentId: string | null;
  isSystem: boolean;
  description: string | null;
  version: number;
  status: 'active' | 'disabled';
}

export interface TenantResponse {
  id: string;
  name: string;
  code: string;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams extends PaginationParams {
  name?: string;
  email?: string;
  status?: string;
}

export interface ListRolesParams extends PaginationParams {
  tenantCode?: string;
  name?: string;
  status?: string;
}
