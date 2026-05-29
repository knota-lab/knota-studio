import type { PaginationParams } from './common';

// TenantResponse lives in types/user.ts to avoid circular deps — re-export here
export type { TenantResponse } from '@/types/user';

export interface CreateTenantRequest {
  name: string;
  code: string;
  status?: string;
  description?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  status?: string;
  description?: string | null;
}

export interface CreateTenantAdminRequest {
  email: string;
  password: string;
  name: string;
}

export interface ListTenantsParams extends PaginationParams {
  name?: string;
  code?: string;
  status?: string;
}
