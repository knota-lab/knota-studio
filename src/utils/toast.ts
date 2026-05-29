/**
 * Toast utilities for pages.
 *
 * ✅ toast.success / toast.info / toast.warning — 直接使用
 * ⚠️ toast.assertNotApiError.error() — 仅用于非 API 错误
 *
 * API 请求失败由 client.ts 统一处理，禁止在 pages 中手动 toast。
 */

import { toast as sonner } from 'sonner';

export const toast = {
  success: sonner.success,
  info: sonner.info,
  warning: sonner.warning,
  /**
   * ⚠️ 仅用于非 API 请求错误（客户端校验、浏览器 API 失败等）。
   * 使用此方法前请确认：这不是一个 API 请求的 catch 结果。
   */
  assertNotApiError: {
    error: sonner.error,
  },
};
