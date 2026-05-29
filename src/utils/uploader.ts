import { useCallback, useMemo, useState } from 'react';
import { type SysScope, uploadFile } from '@/api/files';

export type UploadPhase =
  | 'hashing-fast'
  | 'probing'
  | 'hashing-full'
  | 'instant-confirming'
  | 'small-uploading'
  | 'initiating'
  | 'uploading-parts'
  | 'completing'
  | 'done'
  | 'error';

export interface UploadingItem {
  uid: string;
  name: string;
  size: number;
  phase: UploadPhase;
  hashLoaded: number;
  partsDone: number;
  partsTotal: number;
  bytesUploaded: number;
}

interface UseUploaderOptions {
  bizType: string;
  bizId: string;
  sys?: SysScope;
  onSuccess?: () => void;
}

export const useUploader = ({
  bizType: _bizType,
  bizId: _bizId,
  sys,
  onSuccess,
}: UseUploaderOptions) => {
  const [uploadingItems, setUploadingItems] = useState<
    Record<string, UploadingItem>
  >({});

  const updateItem = useCallback(
    (uid: string, updater: (current: UploadingItem) => UploadingItem) => {
      setUploadingItems((current) => {
        const item = current[uid];
        if (!item) {
          return current;
        }

        return {
          ...current,
          [uid]: updater(item),
        };
      });
    },
    [],
  );

  const removeItem = useCallback((uid: string) => {
    setUploadingItems((current) => {
      const next = { ...current };
      delete next[uid];
      return next;
    });
  }, []);

  const upload = useCallback(
    async (file: File) => {
      const uid = crypto.randomUUID();

      setUploadingItems((current) => ({
        ...current,
        [uid]: {
          uid,
          name: file.name,
          size: file.size,
          phase:
            file.size <= 5 * 1024 * 1024 ? 'small-uploading' : 'initiating',
          hashLoaded: 0,
          partsDone: 0,
          partsTotal: 0,
          bytesUploaded: 0,
        },
      }));

      try {
        const result = await uploadFile(file, {
          sys,
          onPhaseChange: (phase) => {
            updateItem(uid, (item) => ({
              ...item,
              phase,
            }));
          },
          onHashProgress: (loadedBytes) => {
            updateItem(uid, (item) => ({
              ...item,
              hashLoaded: loadedBytes,
            }));
          },
          onUploadProgress: (progress) => {
            updateItem(uid, (item) => ({
              ...item,
              phase: 'uploading-parts',
              partsDone: progress.partsDone,
              partsTotal: progress.partsTotal,
              bytesUploaded: progress.bytesUploaded,
            }));
          },
        });

        updateItem(uid, (item) => ({
          ...item,
          phase: 'done',
          hashLoaded: item.size,
          bytesUploaded: item.size,
          partsDone: item.partsTotal || item.partsDone,
        }));

        onSuccess?.();
        return result;
      } catch (error) {
        updateItem(uid, (item) => ({
          ...item,
          phase: 'error',
        }));
        throw error;
      } finally {
        window.setTimeout(() => removeItem(uid), 800);
      }
    },
    [onSuccess, removeItem, sys, updateItem],
  );

  return useMemo(
    () => ({
      upload,
      uploadingItems,
    }),
    [upload, uploadingItems],
  );
};
