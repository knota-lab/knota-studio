import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';

// biome-ignore lint/style/useNamingConvention: global constant
export const FILE_TABLE_ID = 'system_files_list';

export function createFileColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'resourceType',
      label: t('FileMgmt.resourceType', '业务类型'),
      size: 140,
      minSize: 100,
      filterable: true,
      sortable: false,
      description: t('FileMgmt.resourceTypeDesc', '业务资源类型'),
      search: {
        type: 'text',
        placeholder: t('FileMgmt.resourceTypePlaceholder', '搜索业务类型'),
      },
    },
    {
      key: 'resourceId',
      label: t('FileMgmt.resourceId', '业务ID'),
      size: 200,
      minSize: 120,
      filterable: false,
      sortable: false,
      description: t('FileMgmt.resourceIdDesc', '业务资源ID'),
    },
    {
      key: 'file.name',
      label: t('FileMgmt.fileName', '文件名'),
      size: 240,
      minSize: 120,
      filterable: true,
      sortable: false,
      description: t('FileMgmt.fileNameDesc', '文件名称'),
      search: {
        type: 'text',
        placeholder: t('FileMgmt.fileNamePlaceholder', '搜索文件名'),
      },
    },
    {
      key: 'file.size',
      label: t('FileMgmt.fileSize', '大小'),
      size: 100,
      minSize: 80,
      filterable: false,
      sortable: false,
      description: t('FileMgmt.fileSizeDesc', '文件大小'),
    },
    {
      key: 'file.mimeType',
      label: t('FileMgmt.mimeType', 'MIME类型'),
      size: 160,
      minSize: 100,
      filterable: false,
      sortable: false,
      description: t('FileMgmt.mimeTypeDesc', '文件MIME类型'),
    },
    {
      key: 'createdAt',
      label: t('FileMgmt.createdAt', '创建时间'),
      size: 180,
      minSize: 120,
      filterable: false,
      sortable: true,
      description: t('FileMgmt.createdAtDesc', '创建时间'),
    },
    {
      key: 'details',
      label: t('FileMgmt.actions', '操作'),
      size: 200,
      minSize: 150,
      enableResizing: false,
      align: 'center',
      filterable: false,
      sortable: false,
      description: t('FileMgmt.actionsDesc', '下载、预览、解除引用'),
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
// All @/api imports for this module are centralized here.
// Validation wrappers will be added incrementally.

export type {
  FileReferenceWithFileResponse,
  SysScope as FileRefsSysScope,
} from '@/api/file_references';
export { detachFileReference, listFileReferences } from '@/api/file_references';
export type { SysScope as FilesSysScope } from '@/api/files';
export { fetchFileContent, getPreviewUrl, triggerDownload } from '@/api/files';
export { getAllTenants } from '@/api/tenants';
