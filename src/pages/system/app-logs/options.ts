import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';

// biome-ignore lint/style/useNamingConvention: global constant
export const APP_LOG_TABLE_ID = 'system_app_logs_list';

export function createAppLogTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'timestamp',
      label: t('AppLogMgmt.column.timestamp', '时间'),
      size: 180,
      filterable: false,
      sortable: false,
      description: t('AppLogMgmt.column.timestampDesc', '请求时间'),
    },
    {
      key: 'method',
      label: t('AppLogMgmt.column.method', '方法'),
      size: 90,
      filterable: true,
      sortable: false,
      description: t('AppLogMgmt.column.methodDesc', 'HTTP 方法'),
      search: {
        type: 'select',
        placeholder: t('AppLogMgmt.column.methodPlaceholder', '选择方法'),
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
          { value: 'PATCH', label: 'PATCH' },
        ],
      },
    },
    {
      key: 'path',
      label: t('AppLogMgmt.column.path', '路径'),
      size: 300,
      filterable: true,
      sortable: false,
      description: t('AppLogMgmt.column.pathDesc', '请求路径'),
      search: {
        type: 'text',
        placeholder: t('AppLogMgmt.column.pathPlaceholder', '搜索路径'),
      },
    },
    {
      key: 'statusCode',
      label: t('AppLogMgmt.column.statusCode', '状态码'),
      size: 100,
      align: 'center',
      filterable: true,
      sortable: false,
      description: t('AppLogMgmt.column.statusCodeDesc', 'HTTP 状态码'),
      search: {
        type: 'select',
        placeholder: t('AppLogMgmt.column.statusCodePlaceholder', '状态码范围'),
        options: [
          { value: '200', label: '2xx' },
          { value: '300', label: '3xx' },
          { value: '400', label: '4xx' },
          { value: '500', label: '5xx' },
        ],
      },
    },
    {
      key: 'durationMs',
      label: t('AppLogMgmt.column.durationMs', '耗时'),
      size: 100,
      align: 'right',
      filterable: false,
      sortable: false,
      description: t('AppLogMgmt.column.durationMsDesc', '请求耗时(ms)'),
      search: {
        type: 'text',
        placeholder: t('AppLogMgmt.column.durationPlaceholder', '最小耗时(ms)'),
        order: 6,
        transform: (value: unknown) => {
          const v = Number(value);
          return Number.isNaN(v) ? {} : { minDuration: v };
        },
      },
    },
    {
      key: 'ipAddress',
      label: t('AppLogMgmt.column.ipAddress', 'IP'),
      size: 130,
      filterable: false,
      sortable: false,
      description: t('AppLogMgmt.column.ipAddressDesc', '客户端IP'),
      search: {
        type: 'text',
        placeholder: t('AppLogMgmt.column.ipAddressPlaceholder', '搜索 IP'),
      },
    },
    {
      key: 'traceId',
      label: t('AppLogMgmt.column.traceId', 'Trace ID'),
      size: 200,
      filterable: false,
      sortable: false,
      description: t('AppLogMgmt.column.traceIdDesc', '链路追踪ID'),
      search: {
        type: 'text',
        placeholder: t('AppLogMgmt.column.traceIdPlaceholder', '搜索 Trace ID'),
      },
    },
    {
      key: 'error',
      label: t('AppLogMgmt.column.error', '错误'),
      size: 200,
      filterable: false,
      sortable: false,
      description: t('AppLogMgmt.column.errorDesc', '错误信息'),
      search: {
        type: 'select',
        options: [
          { value: 'true', label: t('AppLogMgmt.filter.hasError', '仅看错误') },
        ],
        placeholder: t('AppLogMgmt.filter.hasErrorPlaceholder', '筛选错误'),
        order: 7,
        transform: (value: unknown) =>
          value === 'true' ? { hasError: true } : {},
      },
    },
    {
      key: 'dateRange',
      label: t('AppLogMgmt.column.dateRange', '时间范围'),
      filterable: true,
      sortable: false,
      visible: false,
      description: t('AppLogMgmt.column.dateRangeDesc', '按时间范围筛选'),
      search: {
        showSeconds: true,
        type: 'dateRange',
        placeholder: t(
          'AppLogMgmt.column.dateRangePlaceholder',
          '选择时间范围',
        ),
        transform: (value: unknown) => {
          const range = value as [string, string];
          return {
            from: range[0] ? new Date(range[0]).getTime() : undefined,
            to: range[1] ? new Date(range[1]).getTime() : undefined,
          };
        },
      },
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
// All @/api imports for this module are centralized here.
// Validation wrappers will be added incrementally.

export type {
  LogEntry,
  RequestLog,
  TraceDetail,
  TraceSpan,
} from '@/api/app-logs';
export { getAppLogStats, getAppLogs, getTraceDetail } from '@/api/app-logs';
