import { del, get, patch, post, put } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';

// ─── Types ──────────────────────────────────────────────────

export interface WorkerDefinitionResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  paramsSchema: string | null;
  timeoutSecs: number;
  maxRetries: number;
  allowConcurrent: boolean;
  isSystem: boolean;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerGrant {
  id: string;
  workerDefId: string;
  tenantId: string;
  grantedBy: string | null;
  createdAt: string;
}

export interface GrantedTenant {
  id: string;
  name: string;
  code: string;
}

export interface WorkerScheduleResponse {
  id: string;
  workerDefId: string;
  tenantId: string;
  name: string;
  cronExpr: string;
  paramsJson: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  workerName: string | null;
  workerCode: string | null;
}

export interface WorkerExecutionResponse {
  id: string;
  scheduleId: string;
  workerDefId: string;
  tenantId: string;
  triggerType: string;
  triggeredBy: string | null;
  paramsJson: string | null;
  status: string;
  retryCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  output: string | null;
  errorMessage: string | null;
  createdAt: string;
  workerName: string | null;
  workerCode: string | null;
  scheduleName: string | null;
}

export interface TriggerResponse {
  executionId: string;
}

// ─── Request types ──────────────────────────────────────────

export interface CreateWorkerDefinitionRequest {
  code: string;
  name: string;
  description?: string;
  category: string;
  paramsSchema?: string;
  timeoutSecs?: number;
  maxRetries?: number;
  allowConcurrent?: boolean;
}

export interface UpdateWorkerDefinitionRequest {
  name?: string;
  description?: string | null;
  category?: string;
  paramsSchema?: string | null;
  timeoutSecs?: number;
  maxRetries?: number;
  allowConcurrent?: boolean;
}

export interface CreateWorkerScheduleRequest {
  workerDefId: string;
  name: string;
  cronExpr: string;
  paramsJson?: string;
}

export interface UpdateWorkerScheduleRequest {
  name?: string;
  cronExpr?: string;
  paramsJson?: string | null;
}

// ─── Worker Definitions ─────────────────────────────────────

export const listWorkerDefinitions = () =>
  get<WorkerDefinitionResponse[]>('/worker-definitions');

export const getWorkerDefinition = (code: string) =>
  get<WorkerDefinitionResponse>(`/worker-definitions/${code}`);

export const createWorkerDefinition = (data: CreateWorkerDefinitionRequest) =>
  post<WorkerDefinitionResponse>('/worker-definitions', data);

export const updateWorkerDefinition = (
  code: string,
  data: UpdateWorkerDefinitionRequest,
) => put<WorkerDefinitionResponse>(`/worker-definitions/${code}`, data);

export const patchWorkerDefinitionStatus = (code: string, status: string) =>
  patch<WorkerDefinitionResponse>(`/worker-definitions/${code}/status`, {
    status,
  });

export const getWorkerGrants = (code: string) =>
  get<WorkerGrant[]>(`/worker-definitions/${code}/grants`);

export const batchSetWorkerGrants = (code: string, tenantIds: string[]) =>
  put<WorkerGrant[]>(`/worker-definitions/${code}/grants`, { tenantIds });

export const getWorkerGrantTenants = (code: string) =>
  get<GrantedTenant[]>(`/worker-definitions/${code}/grants/tenants`);

// ─── Worker Schedules ───────────────────────────────────────

export const listWorkerSchedules = () =>
  get<WorkerScheduleResponse[]>('/worker-schedules');

export const createWorkerSchedule = (data: CreateWorkerScheduleRequest) =>
  post<WorkerScheduleResponse>('/worker-schedules', data);

export const updateWorkerSchedule = (
  id: string,
  data: UpdateWorkerScheduleRequest,
) => put<WorkerScheduleResponse>(`/worker-schedules/${id}`, data);

export const patchWorkerScheduleStatus = (id: string, enabled: boolean) =>
  patch<WorkerScheduleResponse>(`/worker-schedules/${id}/status`, { enabled });

export const deleteWorkerSchedule = (id: string) =>
  del(`/worker-schedules/${id}`);

export const triggerWorkerSchedule = (id: string) =>
  post<TriggerResponse>(`/worker-schedules/${id}/trigger`);

// ─── Worker Executions ──────────────────────────────────────

export const listWorkerExecutions = (params: {
  page: number;
  pageSize: number;
}) =>
  get<PaginatedResponse<WorkerExecutionResponse>>('/worker-executions', {
    params: { page: params.page, pageSize: params.pageSize },
  });

export const getWorkerExecution = (id: string) =>
  get<WorkerExecutionResponse>(`/worker-executions/${id}`);
