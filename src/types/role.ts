import type { MergedMenuTreeResponse } from '@/types/api';

export interface CreateRoleRequest {
  name: string;
  code: string;
  parentId?: string;
  isSystem?: boolean;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  code?: string;
  parentId?: string | null;
  description?: string | null;
  version: number;
  status?: string;
}

export interface AssignableMenusResponse {
  menus: MergedMenuTreeResponse[];
  assignedMenuIds: string[];
}
