import { del, get, post, put } from '@/api/client';
import type { SysMenuResponse, SysMenuTreeResponse } from '@/types/api';

export interface CreateSysMenuRequest {
  name: string;
  code: string;
  type: string;
  path?: string | null;
  alias?: string | null;
  icon?: string | null;
  parentId?: string | null;
  isCache?: boolean;
  sortOrder?: number;
  remark?: string | null;
}

export interface UpdateSysMenuRequest {
  name?: string;
  code?: string;
  type?: string;
  path?: string | null;
  alias?: string | null;
  icon?: string | null;
  parentId?: string | null;
  isCache?: boolean;
  sortOrder?: number;
  remark?: string | null;
  status?: string;
  version: number;
}

export const getSysMenuTree = () =>
  get<SysMenuTreeResponse[]>('/sys-menus/tree');

export const createSysMenu = (data: CreateSysMenuRequest) =>
  post<SysMenuResponse>('/sys-menus', data);

export const updateSysMenu = (id: string, data: UpdateSysMenuRequest) =>
  put<SysMenuResponse>(`/sys-menus/${id}`, data);

export const deleteSysMenu = (id: string) => del(`/sys-menus/${id}`);
