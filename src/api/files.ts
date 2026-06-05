/**
 * 文件管理 SDK (Wave 4 — 两阶段秒传 probe → instant-upload + 软删除复活)。
 *
 * Endpoints (camelCase 序列化，与后端 `serde(rename_all = "camelCase")` 对齐):
 *   - 租户路由:  /api/files/*  + /api/file-uploads/*
 *   - 超管镜像:  /api/sys/tenants/{tenantCode}/files/*
 *               + /api/sys/tenants/{tenantId}/file-uploads/*
 *
 * 上传策略 (Wave 4 — 严格"按需算 full hash"):
 *   - size <= smallUploadLimit (5 MiB): 直接 small_upload (前端不算 hash)。
 *   - smallUploadLimit < size < fastHashThreshold (32 MiB):
 *       直接 multipart, expectedHash 省略 (后端 complete 阶段流式算)。
 *   - size >= fastHashThreshold:
 *       (a) 算 fast-hash → POST /file-uploads/probe
 *           - Miss      → 跳到 (c) multipart (前端**不**算 full hash)
 *           - Suspect   → (b) 客户端秒传确认 (后端"邀请"前端补算 full hash)
 *       (b) 算 full hash → POST /file-uploads/instant-upload
 *           - Confirmed → 拉一次 getFile(id) 返完整 FileResponse 直接结束
 *                         (revived=true 时调用方可 toast「已恢复」)
 *           - Miss      → 跳到 (c) multipart (expectedHash 省略,
 *                         路径与 probe Miss 完全一致, 后端流式算 hash 入库)
 *       (c) initiate → sign/PUT/register × N → complete (后端流式算 hash 终判 + 入库)。
 *   - hash: blake3 (hash-wasm)。fast = b3fast:hex64; full = b3:hex64。
 *
 * 关键不变量:
 *   "前端只在 probe Suspect 这条路径上算 full hash" —— 其他所有路径前端都不扫整个文件,
 *   省去 GB 级文件做不必要的本地 hash。后端在 complete 阶段始终流式重算并以此为权威源。
 *
 * 失败处理: multipart 任意阶段失败 -> 自动 DELETE /file-uploads/{id} 兜底。
 */

import { createBLAKE3 } from 'hash-wasm';
import { del, get, getBlob, post, postMultipart } from '@/api/client';
import type { PaginatedResponse } from '@/types/common';

// ---------- 常量 (与后端 file_upload_service.rs 对齐) ----------

/** 后端 small upload 上限 (controllers/files.rs MAX_SMALL_UPLOAD_BYTES = 5 MiB)。 */
export const smallUploadLimit = 5 * 1024 * 1024;

/** 后端 fast-hash 阈值 (file_upload_service.rs FAST_HASH_THRESHOLD = 32 MiB)。 */
export const fastHashThreshold = 32 * 1024 * 1024;

/** 后端 fast-hash 三段窗口 (file_upload_service.rs FAST_HASH_WINDOW = 10 MiB)。 */
export const fastHashWindow = 10 * 1024 * 1024;

/** Multipart 默认 partSize (服务端会按 partition_policy 重算并下发权威值)。 */
export const defaultPartSize = 5 * 1024 * 1024;

/** Multipart 客户端并发上限 (与设计文档保持一致: 5 MiB × 3)。 */
export const multipartConcurrency = 3;

/** 文本/图片预览体积上限 (>20 MiB 不预览)。 */
export const previewSizeLimit = 20 * 1024 * 1024;

// ---------- 类型 (与 src/views/files.rs / src/views/file_uploads.rs 对齐) ----------

export interface FileResponse {
  id: string;
  tenantId: string;
  name: string;
  mimeType: string;
  size: number;
  contentHash: string;
  contentHashAlgo: string;
  contentHashFast: string | null;
  storageBackend: string;
  bucket: string;
  storageKey: string;
  status: string;
  statusReason: string | null;
  multipartUploadId: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DedupCheckRequest {
  contentHash: string;
  size: number;
  name: string;
}

export interface DedupCheckResponse {
  hit: boolean;
  file: FileResponse | null;
}

export interface DownloadUrlResponse {
  url: string;
  expiresAt: string;
}

export interface SoftDeleteRequest {
  reason?: string | null;
}

export interface ProbeRequest {
  fileName: string;
  fileSize: number;
  contentHashFast: string;
  mimeTypeHint?: string;
}

export interface ProbeUploadHint {
  endpoint: string;
  partSize: number;
  partsTotal: number;
  concurrencyHint: number;
  requiresFullHash: boolean;
}

export interface ProbeMissResponse {
  match: 'miss';
  uploadHint: ProbeUploadHint;
}

export interface ProbeSuspectResponse {
  match: 'suspect';
  expiresAt: string;
  requiresFullHashConfirm: boolean;
}

export type ProbeResponse = ProbeMissResponse | ProbeSuspectResponse;

/**
 * `/api/file-uploads/instant-upload` 请求体（client-side instant-upload 协议第二阶段）。
 *
 * 调用前置: probe 返回 `match: 'suspect'`，客户端已计算 full blake3。后端会:
 *   1) 用 `(content_hash, expected_size)` 在同租户内查 active/soft-deleted 候选；
 *   2) 若候选 `content_hash_fast` 非空且与 `content_hash_fast` 不一致 -> 422 fast_hash_mismatch；
 *   3) soft-deleted 候选在 grace 期内可 revive；过期返 410 grace_expired；
 *   4) 命中 -> Confirmed{file, revived}; 完全未命中 -> Miss{uploadHint}。
 *
 * `Idempotency-Key` header 必填: 后端按 `(tenant, user, expectedHash, idempotencyKey)`
 * 复用 24h 缓存。该 key 由调用方生成（建议 UUID v4），仅作为 header 传递；
 * 后端 DTO 不读 body 里的任何 upload id 字段。
 */
export interface InstantUploadRequest {
  fileName: string;
  expectedSize: number;
  /**
   * 客户端权威 full hash (instant-upload 场景下 = 断言"我这个文件就是这个 hash")。
   * 后端 DTO 字段名: `expected_hash` (与 InitiateUploadRequest 共享语义)。
   */
  expectedHash: string;
  /** 与 expectedHash 配套的算法标识，固定 `"b3"` (后端 `CONTENT_HASH_ALGO_B3`)。 */
  expectedHashAlgo: string;
  /** 后端 DTO 字段名: `expected_hash_fast` (前缀 `b3fast:` + 64 hex)。 */
  expectedHashFast: string;
  mimeTypeHint?: string;
}

export interface InstantUploadConfirmed {
  result: 'confirmed';
  file: UploadFileSummary;
  /** true 表示命中了 soft-deleted 行并被复活；UI 可提示「已恢复」。 */
  revived: boolean;
}

export interface InstantUploadMiss {
  result: 'miss';
  uploadHint: ProbeUploadHint;
}

export type InstantUploadResponse = InstantUploadConfirmed | InstantUploadMiss;

export interface InitiateUploadRequest {
  fileName: string;
  expectedSize: number;
  /**
   * 客户端权威 full hash。Wave 4 起改为可选 —— 只有当前端**已经**算过 full hash
   * （即 probe Suspect → /instant-upload 已确认必算的那一条路径）时才传；
   * 其他路径（small、中等 multipart、probe Miss、Suspect→Miss）一律省略，
   * 由后端 complete 阶段流式重算并入库。
   *
   * 后端 DTO: `expected_hash: Option<String>` (Wave 4 Phase A+B)。
   */
  expectedHash?: string;
  /**
   * Hash 算法标识。即使 `expectedHash` 省略，后端仍要求该字段存在 (非 Optional)，
   * 故无论是否携带 expectedHash 都需固定传 `"b3"`，与后端 `CONTENT_HASH_ALGO_B3` 对齐。
   */
  expectedHashAlgo: string;
  partSize: number;
  expectedHashFast?: string;
  mimeTypeHint?: string;
}

export interface InitiateUploadResponse {
  id: string;
  status: string;
  partSize: number;
  partsTotal: number;
  presignedUrlTtlSeconds: number;
  expiresAt: string;
  tempKey: string;
}

export interface SignPartResponse {
  uploadId: string;
  partNumber: number;
  url: string;
  method: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
  presignedUrlTtlSeconds: number;
}

export interface RegisterPartRequest {
  etag: string;
  size: number;
}

export interface RegisterPartResponse {
  uploadId: string;
  partNumber: number;
  partsReceived: number;
  status: string;
}

export interface UploadFileSummary {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  contentHash: string;
  contentHashAlgo: string;
  status: string;
}

export interface CompleteUploadResponse {
  file: UploadFileSummary;
  uploadId: string;
  status: string;
}

export interface AbortUploadResponse {
  id: string;
  status: string;
}

// ---------- 路径辅助 (tenant vs sys 镜像统一前缀) ----------

interface ScopePaths {
  files: string;
  uploads: string;
}

/**
 * 路径范围: undefined -> 当前租户 (`/api/files`, `/api/file-uploads`)；
 * 提供 `tenantCode` (用于 files) 或 `tenantId` (用于 uploads) -> 超管跨租户镜像。
 *
 * 注意: 后端两套 sys 路由占位符不同 (sys_files 用 `{tenantCode}`,
 * sys_file_uploads 用 `{tenantId}`)，调用方需正确传入字符串。
 */
export interface SysScope {
  /** files 镜像路径占位 (string, 通常为租户 code)。 */
  tenantCode: string;
  /** file-uploads 镜像路径占位 (UUID 字符串)。 */
  tenantId: string;
}

const scopePaths = (sys?: SysScope): ScopePaths =>
  sys
    ? {
        files: `/sys/tenants/${encodeURIComponent(sys.tenantCode)}/files`,
        uploads: `/sys/tenants/${encodeURIComponent(sys.tenantId)}/file-uploads`,
      }
    : { files: '/files', uploads: '/file-uploads' };

// ---------- 文件查询 / 删除 / 下载 ----------

export const listFiles = (
  params: { page: number; pageSize: number },
  sys?: SysScope,
) =>
  get<PaginatedResponse<FileResponse>>(scopePaths(sys).files, {
    params: { page: params.page, pageSize: params.pageSize },
  });

export const getFile = (id: string, sys?: SysScope) =>
  get<FileResponse>(`${scopePaths(sys).files}/${id}`);

export const dedupCheck = (data: DedupCheckRequest, sys?: SysScope) =>
  post<DedupCheckResponse>(`${scopePaths(sys).files}/dedup-check`, data);

export const softDeleteFile = (
  id: string,
  data: SoftDeleteRequest,
  sys?: SysScope,
) =>
  del<FileResponse>(`${scopePaths(sys).files}/${id}`, {
    body: data,
  });

export const restoreFile = (id: string, sys?: SysScope) =>
  post<FileResponse>(`${scopePaths(sys).files}/${id}/restore`, {});

/**
 * 下载/预览 disposition 选项。`attachment` (默认) 触发浏览器下载对话框,
 * `inline` 让浏览器内联渲染 (图片/PDF 预览场景必须用 inline, 否则浏览器
 * 仍会按 attachment 强制弹下载)。后端会把该值注入到预签名 URL 的
 * `response-content-disposition` 上，对象存储直链回吐时即按此 disposition
 * 行为，并同时回吐正确的文件名 + MIME (绕开 CAS `.bin` 物理 key)。
 */
export type DownloadDisposition = 'attachment' | 'inline';

export interface GetDownloadUrlOptions {
  disposition?: DownloadDisposition;
}

export const getDownloadUrl = (
  id: string,
  sys?: SysScope,
  options?: GetDownloadUrlOptions,
) =>
  get<DownloadUrlResponse>(`${scopePaths(sys).files}/${id}/download-url`, {
    params: options?.disposition
      ? { disposition: options.disposition }
      : undefined,
  });

/** 服务端代理下载 (Blob)。优先用预签名直链，失败时调用方可降级到此函数。 */
export const fetchFileContent = (id: string, sys?: SysScope) =>
  getBlob(`${scopePaths(sys).files}/${id}/content`);

// ---------- 上传会话 (multipart) ----------

/**
 * 生成 Idempotency-Key (UUID v4)。后端 ensure_idempotency_key 强制要求
 * initiate / register_part / complete / abort 四个端点必须携带此 header。
 */
const newIdempotencyKey = (): string => {
  return crypto.randomUUID();
};

const idemHeader = (key: string): Record<string, string> => ({
  'Idempotency-Key': key,
});

export const probeUpload = (data: ProbeRequest, sys?: SysScope) =>
  post<ProbeResponse>(`${scopePaths(sys).uploads}/probe`, data);

/**
 * 客户端秒传确认 (probe Suspect 之后的第二跳)。
 *
 * 必须传 `Idempotency-Key` header — 后端用它做 24h 幂等缓存的一部分。
 * 后端缓存 PK = `(tenant, user, expectedHash, idempotencyKey)`；body 不含任何
 * upload id 字段，幂等键只能从 header 拿，故 `idempotencyKey` 参数为必填。
 */
export const instantUpload = (
  data: InstantUploadRequest,
  sys: SysScope | undefined,
  idempotencyKey: string,
) =>
  post<InstantUploadResponse>(
    `${scopePaths(sys).uploads}/instant-upload`,
    data,
    { headers: idemHeader(idempotencyKey) },
  );

export const initiateUpload = (
  data: InitiateUploadRequest,
  sys?: SysScope,
  idempotencyKey?: string,
) =>
  post<InitiateUploadResponse>(scopePaths(sys).uploads, data, {
    headers: idemHeader(idempotencyKey ?? newIdempotencyKey()),
  });

export const signPart = (
  uploadId: string,
  partNumber: number,
  sys?: SysScope,
) =>
  post<SignPartResponse>(
    `${scopePaths(sys).uploads}/${uploadId}/parts/${partNumber}/sign`,
    {},
  );

export const registerPart = (
  uploadId: string,
  partNumber: number,
  data: RegisterPartRequest,
  sys?: SysScope,
  idempotencyKey?: string,
) =>
  post<RegisterPartResponse>(
    `${scopePaths(sys).uploads}/${uploadId}/parts/${partNumber}/register`,
    data,
    { headers: idemHeader(idempotencyKey ?? newIdempotencyKey()) },
  );

export const completeUpload = (
  uploadId: string,
  sys?: SysScope,
  idempotencyKey?: string,
) =>
  post<CompleteUploadResponse>(
    `${scopePaths(sys).uploads}/${uploadId}/complete`,
    {},
    { headers: idemHeader(idempotencyKey ?? newIdempotencyKey()) },
  );

export const abortUpload = (
  uploadId: string,
  sys?: SysScope,
  idempotencyKey?: string,
) =>
  del<AbortUploadResponse>(`${scopePaths(sys).uploads}/${uploadId}`, {
    headers: idemHeader(idempotencyKey ?? newIdempotencyKey()),
  });

// ---------- Small-file 直传 (≤5 MiB, multipart/form-data) ----------

export const smallUpload = (
  file: File,
  sys?: SysScope,
): Promise<FileResponse> => {
  const form = new FormData();
  form.append('file', file, file.name);
  return postMultipart<FileResponse>(scopePaths(sys).files, form);
};

// ---------- Hash 计算 (blake3 via hash-wasm) ----------

/** 读取 File 指定区间为 Uint8Array (浏览器 Blob.slice + arrayBuffer)。 */
const readSlice = async (
  file: File,
  start: number,
  end: number,
): Promise<Uint8Array> => {
  if (end <= start) return new Uint8Array(0);
  const buf = await file.slice(start, end).arrayBuffer();
  return new Uint8Array(buf);
};

/**
 * 计算 fast-hash，与后端 `services/file_upload_service.rs::stream_object_hashes`
 * + `fast_hash_sample_ranges` 严格对齐:
 *   blake3( head[0..10MiB] || mid[size/2 - 5MiB .. + 10MiB] || tail[size - 10MiB .. size] )
 *
 * - 仅在 size >= fastHashThreshold (32 MiB) 时由调用方触发；调用方负责门控。
 * - 后端**不**把 size 字段拼进 hasher，前端也禁止追加，否则必然 fast_hash_mismatch。
 * - 返回带前缀的字符串 `b3fast:<64hex>`。
 */
export const computeFastHash = async (file: File): Promise<string> => {
  const size = file.size;
  const w = fastHashWindow;
  const head = await readSlice(file, 0, w);
  const midStart = Math.floor(size / 2) - Math.floor(w / 2);
  const mid = await readSlice(file, midStart, midStart + w);
  const tailStart = size - w;
  const tail = await readSlice(file, tailStart, size);

  const hasher = await createBLAKE3();
  hasher.init();
  hasher.update(head);
  hasher.update(mid);
  hasher.update(tail);
  return `b3fast:${hasher.digest('hex')}`;
};

/**
 * 计算 full blake3 hash, 返回 `b3:<64hex>`。
 *
 * 实现:
 *   - WASM blake3.update 跑在 dedicated Web Worker (`./workers/blake3-hash.worker.ts`),
 *     主线程 0 阻塞, UI 流畅。
 *   - 16 MiB chunk: 减少 worker 往返次数 + 让 SIMD 实现保持热缓存; 268MB 文件
 *     约 17 个 chunk, 总 postMessage 开销 < 1ms 量级。
 *   - I/O ⇄ CPU pipeline: 主线程提前预读 chunk N+1 (Promise), 同时 worker
 *     update chunk N; 用 worker 的 ack 反压, 避免一次性把整个 GB 文件读入内存。
 *   - 用 transferable ArrayBuffer 0 拷贝过户给 worker (chunk 用完即弃)。
 */
export const computeFullHash = async (
  file: File,
  onProgress?: (loadedBytes: number) => void,
): Promise<string> => {
  const CHUNK = 16 * 1024 * 1024;

  const worker = new Worker(
    new URL('./workers/blake3-hash.worker.ts', import.meta.url),
    { type: 'module' },
  );

  // ---- worker 协议: ready / ack / result / error ----
  type WorkerOut =
    | { type: 'ready' }
    | { type: 'ack'; loaded: number }
    | { type: 'result'; hex: string }
    | { type: 'error'; message: string };

  let resolveReady!: () => void;
  let rejectReady!: (err: unknown) => void;
  const ready = new Promise<void>((res, rej) => {
    resolveReady = res;
    rejectReady = rej;
  });

  // ack 队列: 每次 update 主线程 await 下一个 ack; 实现自然反压
  type AckResolver = (loaded: number) => void;
  const ackQueue: AckResolver[] = [];
  let resolveResult!: (hex: string) => void;
  let rejectResult!: (err: unknown) => void;
  const resultPromise = new Promise<string>((res, rej) => {
    resolveResult = res;
    rejectResult = rej;
  });

  const failAll = (err: unknown): void => {
    const e = err instanceof Error ? err : new Error(String(err));
    rejectReady(e);
    rejectResult(e);
  };

  worker.onerror = (ev) => {
    failAll(new Error(`hash worker error: ${ev.message}`));
  };
  worker.onmessage = (ev: MessageEvent<WorkerOut>) => {
    const msg = ev.data;
    switch (msg.type) {
      case 'ready':
        resolveReady();
        break;
      case 'ack': {
        const next = ackQueue.shift();
        next?.(msg.loaded);
        onProgress?.(msg.loaded);
        break;
      }
      case 'result':
        resolveResult(msg.hex);
        break;
      case 'error':
        failAll(new Error(`hash worker: ${msg.message}`));
        break;
    }
  };

  try {
    worker.postMessage({ type: 'init' });
    await ready;

    // Pipeline: 提前发起下一块 read; 当前块在 worker 里 update。
    let nextRead: Promise<Uint8Array> | null = null;
    let offset = 0;
    if (offset < file.size) {
      const end = Math.min(offset + CHUNK, file.size);
      nextRead = readSlice(file, offset, end);
      offset = end;
    }

    while (nextRead) {
      const chunk = await nextRead;
      // 立刻调度下一块 read (与下面 update 并发)
      nextRead =
        offset < file.size
          ? (() => {
              const end = Math.min(offset + CHUNK, file.size);
              const p = readSlice(file, offset, end);
              offset = end;
              return p;
            })()
          : null;

      // 反压: 等本块 ack 再提交下一块, 否则 worker 内部缓存爆炸
      const ackPromise = new Promise<number>((res) => {
        ackQueue.push(res);
      });
      // chunk.buffer 转移所有权, 后续不能再用 chunk
      worker.postMessage({ type: 'update', chunk: chunk.buffer }, [
        chunk.buffer,
      ]);
      await ackPromise;
    }

    worker.postMessage({ type: 'digest' });
    const hex = await resultPromise;
    return `b3:${hex}`;
  } finally {
    worker.terminate();
  }
};

// ---------- Multipart 上传编排 ----------

export interface UploadProgress {
  /** 已经成功 register 的分片数 (0..partsTotal)。 */
  partsDone: number;
  /** 总分片数 (服务端权威 partsTotal)。 */
  partsTotal: number;
  /** 已上传字节数 (按分片粒度累加)。 */
  bytesUploaded: number;
  /** 文件总字节数。 */
  bytesTotal: number;
}

export interface UploadAbortError extends Error {
  uploadId?: string;
  cause?: unknown;
}

const presignedPut = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: Uint8Array,
): Promise<string> => {
  // 预签名直传 S3/MinIO，绝不能附加我们的 Bearer token；headers 仅取后端
  // requiredHeaders。
  const reqHeaders = new Headers();
  for (const [k, v] of Object.entries(headers)) {
    reqHeaders.set(k, v);
  }
  // 用 Blob 包裹 (避免 fetch 把 ArrayBufferView 当 stream 处理)
  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: new Blob([body as BlobPart]),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(
      `S3 part PUT failed: ${response.status} ${response.statusText} - ${text}`,
    );
  }
  // S3 在 ETag 响应头里返回 (带引号)；MinIO 行为一致。
  const etag = response.headers.get('ETag') ?? response.headers.get('etag');
  if (!etag) {
    throw new Error('S3 part PUT response missing ETag header');
  }
  return etag.replace(/^"|"$/g, '');
};

interface PartTask {
  partNumber: number; // 1-based
  start: number;
  end: number;
}

/**
 * 端到端文件上传 (自动选择 small / multipart, 自动 fast-hash probe, 失败自动 abort)。
 *
 * 调用方只需提供 `File` + 可选 `SysScope` + 可选进度回调，返回 `FileResponse`
 * (final 文件元数据)。
 */
export const uploadFile = async (
  file: File,
  options?: {
    sys?: SysScope;
    onPhaseChange?: (
      phase:
        | 'hashing-fast'
        | 'probing'
        | 'hashing-full'
        | 'instant-confirming'
        | 'small-uploading'
        | 'initiating'
        | 'uploading-parts'
        | 'completing',
    ) => void;
    onHashProgress?: (loadedBytes: number) => void;
    onUploadProgress?: (progress: UploadProgress) => void;
    onInstantConfirmed?: (revived: boolean) => void;
    mimeTypeHint?: string;
  },
): Promise<FileResponse> => {
  const sys = options?.sys;

  // 1) ≤5 MiB: 跳过 hash, 直接 small upload (后端会自己算 hash)。
  if (file.size <= smallUploadLimit) {
    options?.onPhaseChange?.('small-uploading');
    return smallUpload(file, sys);
  }

  // 2) ≥32 MiB: 先算 fast-hash 做 probe；Suspect 则走客户端秒传确认。
  let fastHash: string | undefined;
  if (file.size >= fastHashThreshold) {
    options?.onPhaseChange?.('hashing-fast');
    fastHash = await computeFastHash(file);
    options?.onPhaseChange?.('probing');
    const probe = await probeUpload(
      {
        fileName: file.name,
        fileSize: file.size,
        contentHashFast: fastHash,
        ...(options?.mimeTypeHint
          ? { mimeTypeHint: options.mimeTypeHint }
          : {}),
      },
      sys,
    );

    if (probe.match === 'suspect') {
      // 2a) Suspect: 后端"邀请"前端补算 full hash → /instant-upload 终判。
      options?.onPhaseChange?.('hashing-full');
      const fullHash = await computeFullHash(file, options?.onHashProgress);
      options?.onPhaseChange?.('instant-confirming');
      const instantId = newIdempotencyKey();
      const result = await instantUpload(
        {
          fileName: file.name,
          expectedSize: file.size,
          expectedHash: fullHash,
          expectedHashAlgo: 'b3',
          expectedHashFast: fastHash,
          ...(options?.mimeTypeHint
            ? { mimeTypeHint: options.mimeTypeHint }
            : {}),
        },
        sys,
        instantId,
      );
      if (result.result === 'confirmed') {
        options?.onInstantConfirmed?.(result.revived);
        return await getFile(result.file.id, sys);
      }
    }
  }

  // 3) initiate (服务端权威下发 partSize/partsTotal)。
  options?.onPhaseChange?.('initiating');
  const init = await initiateUpload(
    {
      fileName: file.name,
      expectedSize: file.size,
      expectedHashAlgo: 'b3',
      partSize: defaultPartSize,
      ...(fastHash ? { expectedHashFast: fastHash } : {}),
      ...(options?.mimeTypeHint ? { mimeTypeHint: options.mimeTypeHint } : {}),
    },
    sys,
  );

  const uploadId = init.id;
  const partSize = init.partSize;
  const partsTotal = init.partsTotal;

  try {
    // 5) 切分 + 并发 sign/PUT/register。
    options?.onPhaseChange?.('uploading-parts');
    const tasks: PartTask[] = [];
    for (let i = 0; i < partsTotal; i += 1) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      tasks.push({ partNumber: i + 1, start, end });
    }

    let partsDone = 0;
    let bytesUploaded = 0;
    let nextIdx = 0;
    let failed: unknown = null;

    const runOne = async (task: PartTask): Promise<void> => {
      if (failed) return;
      const slice = await readSlice(file, task.start, task.end);
      const sign = await signPart(uploadId, task.partNumber, sys);
      const etag = await presignedPut(
        sign.url,
        sign.method,
        sign.requiredHeaders,
        slice,
      );
      await registerPart(
        uploadId,
        task.partNumber,
        { etag, size: slice.length },
        sys,
      );
      partsDone += 1;
      bytesUploaded += slice.length;
      options?.onUploadProgress?.({
        partsDone,
        partsTotal,
        bytesUploaded,
        bytesTotal: file.size,
      });
    };

    const worker = async (): Promise<void> => {
      while (!failed) {
        const idx = nextIdx;
        nextIdx += 1;
        if (idx >= tasks.length) return;
        try {
          // biome-ignore lint/style/noNonNullAssertion: idx in bounds by check above
          await runOne(tasks[idx]!);
        } catch (e) {
          failed = e;
          return;
        }
      }
    };

    const workers: Promise<void>[] = [];
    const concurrency = Math.min(multipartConcurrency, tasks.length);
    for (let i = 0; i < concurrency; i += 1) workers.push(worker());
    await Promise.all(workers);

    if (failed) throw failed;

    // 6) complete (服务端流式重算 hash + size + MIME, 权威定终态)。
    options?.onPhaseChange?.('completing');
    const completed = await completeUpload(uploadId, sys);

    return await getFile(completed.file.id, sys);
  } catch (err) {
    // 自动 abort: 兜底清理服务端会话，错误向上抛出。
    try {
      await abortUpload(uploadId, sys);
    } catch {
      // abort 失败不掩盖原错误；后端 expires_at 到期会自动 cleanup。
    }
    const wrapped = err instanceof Error ? err : new Error(String(err));
    (wrapped as UploadAbortError).uploadId = uploadId;
    throw wrapped;
  }
};

/**
 * 触发浏览器下载: 优先用预签名直链 (零代理流量)；若直链失败则降级
 * 到 /content 代理流。
 */
export const triggerDownload = async (
  fileId: string,
  fileName: string,
  sys?: SysScope,
): Promise<void> => {
  try {
    const { url } = await getDownloadUrl(fileId, sys, {
      disposition: 'attachment',
    });
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener noreferrer';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // 降级: 拉 blob 再触发下载
    const blob = await fetchFileContent(fileId, sys);
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 0);
  }
};

/**
 * 获取**内联预览**用的预签名直链 (短期有效, 默认 1h)。
 */
export const getPreviewUrl = (fileId: string, sys?: SysScope) =>
  getDownloadUrl(fileId, sys, { disposition: 'inline' });
