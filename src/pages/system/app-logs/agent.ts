import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  APP_LOG_TABLE_ID,
  createAppLogTableColumns,
  getAppLogs,
  getTraceDetail,
} from './options';

export const useAppLogsAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const columns = createAppLogTableColumns(t);

      return {
        meta: {
          route: '/system/app-logs',
          pageKey: 'system_app_logs',
          title: t('AppLogMgmt.title', '应用日志'),
          intent: 'list',
          description: t(
            'AppLogMgmt.description',
            '查看应用请求日志和链路追踪详情。支持按时间、方法、路径、状态码、Trace ID、IP、耗时、错误、用户ID 筛选。viewTraceDetail 返回请求摘要(含userId/requestId) + 调用链路(spans) + 关联日志(含结构化错误字段code/status/location)。',
          ),
        },
        tables: [
          {
            tableId: APP_LOG_TABLE_ID,
            columns: [...columns],
            filterFields: extractFilterFields(columns),
            loader: async (params) => {
              const resp = await getAppLogs({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
                method: params.method as string | undefined,
                path: params.path as string | undefined,
                statusCode: params.statusCode
                  ? Number(params.statusCode)
                  : undefined,
                traceId: params.traceId as string | undefined,
                ipAddress: params.ipAddress as string | undefined,
                from: params.from as number | undefined,
                to: params.to as number | undefined,
                q: params.q as string | undefined,
                hasError: params.hasError as boolean | undefined,
                minDuration: params.minDuration as number | undefined,
                maxDuration: params.maxDuration as number | undefined,
                userId: params.userId as string | undefined,
                requestId: params.requestId as string | undefined,
              });
              return resp;
            },
          },
        ],
        forms: [],
        actions: [
          {
            actionKey: 'viewTraceDetail',
            label: t('AppLogMgmt.action.viewTraceDetail', '查看链路详情'),
            description: t(
              'AppLogMgmt.action.viewTraceDetailDesc',
              '查看指定 Trace ID 的完整请求信息：含请求摘要(方法/路径/状态码/耗时/错误/用户ID/请求ID/IP)、调用链路(spans带耗时和fieldsJson上下文)、关联日志条目(含结构化字段code/status/location/email等)。这就是该请求的完整全貌。',
            ),
            params: [
              {
                name: 'traceId',
                label: 'Trace ID',
                type: 'string',
                required: true,
                description: '链路追踪 ID（UUID 格式）',
              },
            ],
            query: true,
            execute: async (params) => {
              const d = await getTraceDetail(params.traceId as string);
              return d;
            },
          },
        ],
      };
    }, [t]),
  );
};
