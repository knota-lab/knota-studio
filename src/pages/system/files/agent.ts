import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import type { FileRefsSysScope, FilesSysScope } from './options';
import {
  createFileColumns,
  FILE_TABLE_ID,
  listFileReferences,
} from './options';

interface UseFileAgentOptions {
  refsSys?: FileRefsSysScope;
  filesSys?: FilesSysScope;
}

/**
 * Register the Files management page capabilities with the agent store.
 * Lists file references with optional super-admin tenant scoping.
 */
export const useFileAgent = ({
  refsSys,
  filesSys: _filesSys,
}: UseFileAgentOptions) => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(() => {
      const columns = createFileColumns(t);

      return {
        meta: {
          route: '/system/files',
          pageKey: 'system_files',
          title: t('FileMgmt.title', '文件管理'),
          intent: 'list',
          description: t(
            'FileMgmt.description',
            '管理系统文件引用，包括上传、下载、预览和解除引用',
          ),
        },
        tables: [
          {
            tableId: FILE_TABLE_ID,
            columns: [...columns],
            filterFields: extractFilterFields(columns),
            loader: async (params) => {
              const resp = await listFileReferences(
                {
                  page: (params.page as number) ?? 1,
                  pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
                  resourceType: params.resourceType as string | undefined,
                },
                refsSys,
              );
              return resp;
            },
          },
        ],
        forms: [],
        actions: [],
      };
    }, [t, refsSys]),
  );
};
