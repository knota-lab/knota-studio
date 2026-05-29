import { get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type { AssignablePermissionsResponse } from '@/types/permission';
import type {
  AssignableMenusResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@/types/role';
import type { ListRolesParams, RoleResponse } from '@/types/user';

export const listRoles = (params: ListRolesParams = {}) =>
  get<PaginatedResponse<RoleResponse>>('/roles', { params });

export const getRolesByTenant = (tenantCode: string) =>
  listRoles({ tenantCode, page: 1, pageSize: 999 });

export const createRole = (data: CreateRoleRequest) =>
  post<RoleResponse>('/roles', data);

export const updateRole = (id: string, data: UpdateRoleRequest) =>
  put<RoleResponse>(`/roles/${id}`, data);

export const toggleRoleStatus = (id: string, status: 'active' | 'disabled') =>
  put<RoleResponse>(`/roles/${id}/status`, { status });

export const getRolePermissions = (roleId: string) =>
  get<{ permissionIds: string[] }>(`/roles/${roleId}/permissions`);

export const syncRolePermissions = (roleId: string, permissionIds: string[]) =>
  put<void>(
    `/roles/${roleId}/permissions`,
    { permissionIds },
    { throwError: true },
  );

export const getRoleMenus = (roleId: string) =>
  get<{ sysMenuIds: string[] }>(`/roles/${roleId}/menus`);

export const syncRoleMenus = (roleId: string, sysMenuIds: string[]) =>
  put<void>(`/roles/${roleId}/menus`, { sysMenuIds }, { throwError: true });

export const getAssignableMenus = (roleId: string) =>
  get<AssignableMenusResponse>(`/roles/${roleId}/assignable-menus`);

export const getAssignablePermissions = (roleId: string) =>
  get<AssignablePermissionsResponse>(`/roles/${roleId}/assignable-permissions`);
