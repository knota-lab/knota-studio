import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { SysConfigResponse } from '@/types/sys-config';
import {
  createConfigExecutor,
  createSysConfigCreateFields,
  createSysConfigEditFields,
  updateConfigExecutor,
} from './options';

interface SysConfigDialogProps {
  open: boolean;
  config: SysConfigResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SysConfigDialog = ({
  open,
  config,
  onOpenChange,
  onSuccess,
}: SysConfigDialogProps) => {
  const t = useT();
  const lockedConfigRef = useRef(config);
  if (open) {
    lockedConfigRef.current = config;
  }
  const editConfig = lockedConfigRef.current;
  const isEdit = !!editConfig;

  const fields = isEdit
    ? createSysConfigEditFields(t)
    : createSysConfigCreateFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateConfigExecutor(t)({ key: editConfig.key, ...values });
    } else {
      await createConfigExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editConfig?.id}` : 'create'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('SysConfigMgmt.dialog.edit', '编辑配置')
          : t('SysConfigMgmt.dialog.create', '新建配置')
      }
      description={
        isEdit
          ? t('SysConfigMgmt.dialog.editDesc', '修改配置信息')
          : t('SysConfigMgmt.dialog.createDesc', '填写配置信息创建新配置项')
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              key: editConfig.key,
              value: editConfig.value,
              label: editConfig.label,
              valueType: editConfig.valueType,
              category: editConfig.category,
              description: editConfig.description ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { SysConfigDialogProps };
export { SysConfigDialog };
