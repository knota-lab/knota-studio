/**
 * BLAKE3 streaming hash Web Worker.
 *
 * 主线程通过 `computeFullHash` 把文件按 chunk 喂给本 worker, worker 内部用
 * hash-wasm 的 SIMD blake3 增量 update, 算完返 64 位 hex digest。
 *
 * 设计要点:
 *   - 主线程不再被 WASM blake3.update 阻塞, UI 流畅。
 *   - chunk 用 ArrayBuffer 转移 (Transferable) 而非拷贝, 大文件零内存拷贝代价。
 *   - 协议握手式: init → ready, update*N → ack*N, digest → result。
 *     ack 携带累计字节, 主线程据此驱动进度回调。
 *   - worker 自身在 result/error 后关闭 (主线程也会主动 terminate 兜底)。
 */

import { createBLAKE3, type IHasher } from 'hash-wasm';

type InMessage =
  | { type: 'init' }
  | { type: 'update'; chunk: ArrayBuffer }
  | { type: 'digest' };

type OutMessage =
  | { type: 'ready' }
  | { type: 'ack'; loaded: number }
  | { type: 'result'; hex: string }
  | { type: 'error'; message: string };

let hasher: IHasher | null = null;
let loaded = 0;

const post = (msg: OutMessage, transfer?: Transferable[]): void => {
  // self.postMessage 在 worker context 类型为 (msg, transfer) => void
  (self as unknown as Worker).postMessage(msg, transfer ?? []);
};

self.onmessage = async (ev: MessageEvent<InMessage>) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case 'init': {
        hasher = await createBLAKE3();
        hasher.init();
        loaded = 0;
        post({ type: 'ready' });
        return;
      }
      case 'update': {
        if (!hasher) throw new Error('hasher not initialised');
        // hash-wasm 接受 Uint8Array; 直接包裹 transferred ArrayBuffer 零拷贝。
        const view = new Uint8Array(msg.chunk);
        hasher.update(view);
        loaded += view.byteLength;
        post({ type: 'ack', loaded });
        return;
      }
      case 'digest': {
        if (!hasher) throw new Error('hasher not initialised');
        const hex = hasher.digest('hex');
        post({ type: 'result', hex });
        // 用完即焚, 主线程也会 terminate 兜底
        self.close();
        return;
      }
    }
  } catch (err) {
    post({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
    self.close();
  }
};
