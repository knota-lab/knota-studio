import { get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateDictItemRequest,
  CreateDictTypeRequest,
  DictItemResponse,
  DictItemTreeResponse,
  DictTypeResponse,
  ToggleStatusRequest,
  UpdateDictItemRequest,
  UpdateDictTypeRequest,
} from '@/types/dict';

// ─── Dict Type APIs ──────────────────────────────────────────

export const listDictTypes = (params?: { page?: number; pageSize?: number }) =>
  get<PaginatedResponse<DictTypeResponse>>('/dict-types', { params });

export const createDictType = (data: CreateDictTypeRequest) =>
  post<DictTypeResponse>('/dict-types', data);

export const updateDictType = (id: string, data: UpdateDictTypeRequest) =>
  put<DictTypeResponse>(`/dict-types/${id}`, data);

export const toggleDictTypeStatus = (id: string, data: ToggleStatusRequest) =>
  put<DictTypeResponse>(`/dict-types/${id}/status`, data);

export const resetDictTypeOverride = (id: string) =>
  post<void>(`/dict-types/${id}/reset`);

// ─── Dict Item APIs ──────────────────────────────────────────

export const listDictItems = (typeCode: string) =>
  get<DictItemResponse[]>('/dicts', { params: { typeCode } });

export const getDictItemTree = (typeCode: string) =>
  get<DictItemTreeResponse[]>('/dicts/tree', { params: { typeCode } });

export const createDictItem = (data: CreateDictItemRequest) =>
  post<DictItemResponse>('/dicts', data);

export const updateDictItem = (id: string, data: UpdateDictItemRequest) =>
  put<DictItemResponse>(`/dicts/${id}`, data);

export const toggleDictItemStatus = (id: string, data: ToggleStatusRequest) =>
  put<DictItemResponse>(`/dicts/${id}/status`, data);

export const resetDictItemOverride = (id: string) =>
  post<void>(`/dicts/${id}/reset`);
