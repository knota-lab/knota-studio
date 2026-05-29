import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { DictTypeResponse } from '@/types/dict';
import {
  createDictTypeCreateFields,
  createDictTypeEditFields,
  createDictTypeExecutor,
  updateDictTypeExecutor,
} from './options';

interface DictTypeDialogProps {
  open: boolean;
  dictType: DictTypeResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DictTypeDialog = ({
  open,
  dictType,
  onOpenChange,
  onSuccess,
}: DictTypeDialogProps) => {
  const t = useT();
  const lockedRef = useRef(dictType);
  if (open) {
    lockedRef.current = dictType;
  }
  const editType = lockedRef.current;
  const isEdit = !!editType;

  const fields = isEdit
    ? createDictTypeEditFields(t)
    : createDictTypeCreateFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      const executor = updateDictTypeExecutor(t);
      await executor({ id: editType.id, version: editType.version, ...values });
    } else {
      const executor = createDictTypeExecutor(t);
      await executor(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editType?.id}` : 'create-type'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('DictMgmt.dialog.editType', '编辑字典类型')
          : t('DictMgmt.dialog.createType', '新建字典类型')
      }
      description={
        isEdit
          ? t('DictMgmt.dialog.editTypeDesc', '修改字典类型信息')
          : t('DictMgmt.dialog.createTypeDesc', '填写信息创建新的字典类型')
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              name: editType.name,
              description: editType.description ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { DictTypeDialogProps };
export { DictTypeDialog };
