export interface SysConfigResponse {
  id: string;
  key: string;
  value: string;
  valueType: string;
  category: string;
  scope: string;
  tenantId: string | null;
  label: string;
  description: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGlobalConfigRequest {
  key: string;
  value: string;
  valueType: string;
  category: string;
  label: string;
  description?: string | null;
}

export interface UpdateGlobalConfigRequest {
  value: string;
  label?: string;
  description?: string | null;
}
