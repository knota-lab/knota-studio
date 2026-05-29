import { del, get, put } from '@/api/client';
import type {
  MergedMenuTreeResponse,
  UpdateOverrideRequest,
} from '@/types/api';

/** 租户合并菜单树（租管查看用） */
export const getTenantMenuTree = () =>
  get<MergedMenuTreeResponse[]>('/menus/tree');

/** 租户覆盖（租管操作用） */
export const upsertMenuOverride = (
  sysMenuId: string,
  data: UpdateOverrideRequest,
) => put(`/menus/${sysMenuId}/override`, data);

export const deleteMenuOverride = (sysMenuId: string) =>
  del(`/menus/${sysMenuId}/override`);

/** 当前用户可见菜单（侧边栏用） */
export const getUserMenus = () =>
  get<MergedMenuTreeResponse[]>('/users/me/menus');
