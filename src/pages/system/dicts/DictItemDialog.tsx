import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { DictItemResponse } from '@/types/dict';
import {
  createDictItemCreateFields,
  createDictItemEditFields,
  createDictItemExecutor,
  updateDictItemExecutor,
} from './options';

interface DictItemDialogProps {
  open: boolean;
  dictItem: DictItemResponse | null;
  selectedTypeId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DictItemDialog = ({
  open,
  dictItem,
  selectedTypeId,
  onOpenChange,
  onSuccess,
}: DictItemDialogProps) => {
  const t = useT();
  const lockedRef = useRef(dictItem);
  if (open) {
    lockedRef.current = dictItem;
  }
  const editItem = lockedRef.current;
  const isEdit = !!editItem;

  const fields = isEdit
    ? createDictItemEditFields(t)
    : createDictItemCreateFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      const executor = updateDictItemExecutor(t);
      await executor({ id: editItem.id, version: editItem.version, ...values });
    } else {
      const executor = createDictItemExecutor(t);
      await executor({ dictTypeId: selectedTypeId ?? '', ...values });
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editItem?.id}` : 'create-item'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('DictMgmt.dialog.editItem', '编辑字典项')
          : t('DictMgmt.dialog.createItem', '新建字典项')
      }
      description={
        isEdit
          ? t('DictMgmt.dialog.editItemDesc', '修改字典项信息')
          : t('DictMgmt.dialog.createItemDesc', '填写信息创建新的字典项')
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              code: editItem.code,
              name: editItem.name,
              value: editItem.value,
              sortOrder: editItem.sortOrder,
              description: editItem.description ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { DictItemDialogProps };
export { DictItemDialog };
