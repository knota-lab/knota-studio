import { get, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateTenantAdminRequest,
  CreateTenantRequest,
  ListTenantsParams,
  TenantResponse,
  UpdateTenantRequest,
} from '@/types/tenant';

export const listTenants = (params: ListTenantsParams = {}) =>
  get<PaginatedResponse<TenantResponse>>('/tenants', { params });

export const getAllTenants = () => listTenants({ page: 1, pageSize: 1000 });

export const createTenant = (data: CreateTenantRequest) =>
  post<TenantResponse>('/tenants', data);

export const updateTenant = (id: string, data: UpdateTenantRequest) =>
  put<TenantResponse>(`/tenants/${id}`, data);

export const createTenantAdmin = (
  tenantCode: string,
  data: CreateTenantAdminRequest,
) => post(`/sys/tenants/${tenantCode}/admins`, data);
