export interface RoleTemplateResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleTemplateRequest {
  code: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateRoleTemplateRequest {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface TemplateMenuIdsResponse {
  sysMenuIds: string[];
}

export interface SyncTemplateMenusRequest {
  sysMenuIds: string[];
}

export interface TemplatePermissionItem {
  obj: string;
  act: string;
}

export interface SyncTemplatePermissionsRequest {
  permissions: TemplatePermissionItem[];
}
