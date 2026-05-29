import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { TenantResponse } from '@/types/user';
import {
  createTenantEditFormFields,
  createTenantExecutor,
  createTenantFormFields,
  updateTenantExecutor,
} from './options';

interface TenantDialogProps {
  open: boolean;
  tenant: TenantResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TenantDialog = ({
  open,
  tenant,
  onOpenChange,
  onSuccess,
}: TenantDialogProps) => {
  const t = useT();

  const lockedTenantRef = useRef(tenant);
  if (open) {
    lockedTenantRef.current = tenant;
  }
  const editTenant = lockedTenantRef.current;
  const isEdit = !!editTenant;

  const fields = isEdit
    ? createTenantEditFormFields(t)
    : createTenantFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateTenantExecutor(t)({ id: editTenant.id, ...values });
    } else {
      await createTenantExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editTenant.id}` : 'create'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('TenantMgmt.dialog.edit', '编辑租户')
          : t('TenantMgmt.dialog.create', '创建租户')
      }
      description={
        isEdit
          ? t('TenantMgmt.dialog.editDesc', '编辑租户信息')
          : t('TenantMgmt.dialog.createDesc', '创建新租户')
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              name: editTenant.name,
              status: editTenant.status,
              description: editTenant.description ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { TenantDialogProps };
export { TenantDialog };
