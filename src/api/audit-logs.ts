import { get } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';

// ─── Types ───────────────────────────────────────────────

export interface DiffEntry {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditLogResponse {
  id: string;
  traceId: string | null;
  requestId: string | null;
  tenantId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  diff: DiffEntry[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  from?: string;
  to?: string;
}

// ─── API ─────────────────────────────────────────────────

export const listAuditLogs = (params?: AuditLogQuery) =>
  get<PaginatedResponse<AuditLogResponse>>('/audit-logs', { params });
