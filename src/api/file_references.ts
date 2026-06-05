/**
 * 文件引用（file_references）SDK — Wave 5 D7c/d。
 *
 * 与后端 controllers/file_references.rs + sys_file_references.rs 对齐：
 *   - 租户路由: /api/file-references
 *       GET /            → 分页列出当前租户全部活跃 file_references（join files）
 *       DELETE /{id}     → 软解除单条引用（detach，幂等）
 *   - 超管镜像: /api/sys/tenants/{tenantCode}/file-references
 *
 * 设计要点：
 *   - 列表响应的每一行 = 一条业务关联（file_references 行），而非物理文件；
 *     `file` 字段是 join 出来的 files 元数据。
 *   - `displayName` = 业务侧使用该文件时的可见文件名。
 *   - resourceType / resourceId 标识业务对象。`system:attachment` 是「独立上传」
 *     的占位资源类型。
 *   - 删除按钮调 detach 而非 softDeleteFile。
 */

import { del, get } from '@/api/client';
import type { FileResponse } from '@/api/files';
import type { PaginatedResponse } from '@/types/common';

// ---------- 类型 (与 src/views/file_references.rs 对齐) ----------

/**
 * 后端 `FileReferenceWithFileResponse` 的 wire 形状：
 *   `#[serde(flatten)] reference: FileReferenceResponse` + `file: Option<FileResponse>`。
 */
export interface FileReferenceWithFileResponse {
  /** file_references 行自身 id。 */
  id: string;
  tenantId: string;
  fileId: string;
  /** 业务资源类型，形如 `"system:attachment"` / `"crm:contract"`。 */
  resourceType: string;
  /** 业务资源 id（system:attachment 场景下 == 本行 id）。 */
  resourceId: string;
  /** 业务字段名；独立上传场景为空字符串。 */
  fieldName: string;
  /** 业务侧使用该文件时显示的文件名（可与 file.name 不同）。 */
  displayName: string | null;
  createdBy: string;
  createdAt: string;
  /** 关联的物理文件元数据。 */
  file: FileResponse | null;
}

// ---------- 路径辅助 (tenant vs sys 镜像) ----------

interface ScopePath {
  references: string;
}

/**
 * sys 镜像入参；与 files SDK 的 SysScope.tenantCode 对齐。
 */
export interface SysScope {
  tenantCode: string;
}

const scopePath = (sys?: SysScope): ScopePath =>
  sys
    ? {
        references: `/sys/tenants/${encodeURIComponent(sys.tenantCode)}/file-references`,
      }
    : { references: '/file-references' };

// ---------- API ----------

export interface ListFileReferencesParams {
  page: number;
  pageSize: number;
  resourceType?: string;
}

export const listFileReferences = (
  params: ListFileReferencesParams,
  sys?: SysScope,
) =>
  get<PaginatedResponse<FileReferenceWithFileResponse>>(
    scopePath(sys).references,
    {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.resourceType ? { resourceType: params.resourceType } : {}),
      },
    },
  );

/**
 * 软解除单条引用。后端是幂等的（已解除再解除返回 204）。
 */
export const detachFileReference = (referenceId: string, sys?: SysScope) =>
  del<void>(`${scopePath(sys).references}/${referenceId}`);
