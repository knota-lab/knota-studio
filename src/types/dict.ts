export interface DictTypeResponse {
  id: string;
  code: string;
  name: string;
  status: string;
  scope: string; // "system" | "override" | "tenantOnly"
  sourceTypeId: string | null;
  isOverride: boolean;
  description: string | null;
  version: number;
}

export interface CreateDictTypeRequest {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateDictTypeRequest {
  name?: string;
  description?: string | null;
  version: number;
}

export interface DictItemResponse {
  id: string;
  dictTypeId: string;
  code: string;
  name: string;
  value: string;
  parentId: string | null;
  sortOrder: number;
  status: string;
  scope: string;
  sourceItemId: string | null;
  isOverride: boolean;
  description: string | null;
  version: number;
}

export interface DictItemTreeResponse extends DictItemResponse {
  children: DictItemTreeResponse[];
}

export interface CreateDictItemRequest {
  dictTypeId: string;
  code: string;
  name: string;
  value: string;
  parentId?: string | null;
  sortOrder?: number;
  description?: string | null;
}

export interface UpdateDictItemRequest {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
  description?: string | null;
  version: number;
}

export interface ToggleStatusRequest {
  version: number;
}
