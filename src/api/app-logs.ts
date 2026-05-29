import { get } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';

export interface RequestLog {
  id: number;
  traceId: string;
  requestId: string;
  timestamp: number;
  method: string;
  path: string;
  route: string | null;
  statusCode: number | null;
  durationMs: number | null;
  userId: string | null;
  tenantCode: string | null;
  ipAddress: string | null;
  error: string | null;
}

export interface TraceSpan {
  id: number;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  spanName: string;
  spanType: string | null;
  startTime: number;
  durationMs: number | null;
  fieldsJson: string | null;
}

export interface LogEntry {
  id: number;
  traceId: string;
  spanId: string | null;
  timestamp: number;
  level: string;
  target: string | null;
  message: string | null;
  fieldsJson: Record<string, string> | null;
}

export interface TraceDetail {
  request: RequestLog;
  spans: TraceSpan[];
  entries: LogEntry[];
}

export interface AppLogsQueryParams {
  page?: number;
  pageSize?: number;
  method?: string;
  path?: string;
  statusCode?: number;
  from?: number;
  to?: number;
  q?: string;
  traceId?: string;
  ipAddress?: string;
  hasError?: boolean;
  minDuration?: number;
  maxDuration?: number;
  userId?: string;
  requestId?: string;
}

export const getAppLogs = (params: AppLogsQueryParams) =>
  get<PaginatedResponse<RequestLog>>('/admin/app-logs', { params });

export const getTraceDetail = (traceId: string) =>
  get<TraceDetail>(`/admin/app-logs/${traceId}`);

export const getAppLogStats = () =>
  get<{ droppedCount: number }>('/admin/app-logs/stats');
