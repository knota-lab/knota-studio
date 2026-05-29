import { del, get, post, put } from '@/api/client';
import type {
  CreateRoleTemplateRequest,
  RoleTemplateResponse,
  SyncTemplateMenusRequest,
  SyncTemplatePermissionsRequest,
  TemplateMenuIdsResponse,
  TemplatePermissionItem,
  UpdateRoleTemplateRequest,
} from '@/types/role-template';

export const listRoleTemplates = () =>
  get<RoleTemplateResponse[]>('/sys/role-templates');

export const createRoleTemplate = (data: CreateRoleTemplateRequest) =>
  post<RoleTemplateResponse>('/sys/role-templates', data);

export const updateRoleTemplate = (
  id: string,
  data: UpdateRoleTemplateRequest,
) => put<RoleTemplateResponse>(`/sys/role-templates/${id}`, data);

export const deleteRoleTemplate = (id: string) =>
  del(`/sys/role-templates/${id}`);

export const getTemplateMenuIds = (id: string) =>
  get<TemplateMenuIdsResponse>(`/sys/role-templates/${id}/menus`);

export const syncTemplateMenus = (id: string, data: SyncTemplateMenusRequest) =>
  put<void>(`/sys/role-templates/${id}/menus`, data);

export const getTemplatePermissions = (id: string) =>
  get<TemplatePermissionItem[]>(`/sys/role-templates/${id}/permissions`);

export const syncTemplatePermissions = (
  id: string,
  data: SyncTemplatePermissionsRequest,
) => put<void>(`/sys/role-templates/${id}/permissions`, data);
