import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  AUDIT_LOG_TABLE_ID,
  createAuditLogColumns,
  listAuditLogs,
} from './options';

/**
 * Register the Audit Logs page capabilities with the agent store.
 * Read-only page — tables only, no forms or actions.
 */
export const useAuditLogAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const columns = createAuditLogColumns(t);

      return {
        meta: {
          route: '/system/audit-logs',
          pageKey: 'system_audit_logs',
          title: t('AuditLogMgmt.title', '审计日志'),
          intent: 'list',
          description: t(
            'AuditLogMgmt.description',
            '查看系统审计日志，包括操作记录和变更详情',
          ),
        },
        tables: [
          {
            tableId: AUDIT_LOG_TABLE_ID,
            columns: [...columns],
            filterFields: extractFilterFields(columns),
            loader: async (params) => {
              const resp = await listAuditLogs({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
                action: params.action as string | undefined,
                resourceType: params.resourceType as string | undefined,
                from: params.from as string | undefined,
                to: params.to as string | undefined,
              });
              return resp;
            },
          },
        ],
        forms: [],
        actions: [],
      };
    }, [t]),
  );
};
