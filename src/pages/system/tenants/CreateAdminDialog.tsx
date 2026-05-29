import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { TenantResponse } from '@/types/user';
import {
  createTenantAdminExecutor,
  createTenantAdminFormFields,
} from './options';

interface CreateAdminDialogProps {
  open: boolean;
  tenant: TenantResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateAdminDialog = ({
  open,
  tenant,
  onOpenChange,
  onSuccess,
}: CreateAdminDialogProps) => {
  const t = useT();

  const lockedTenantRef = useRef(tenant);
  if (open) {
    lockedTenantRef.current = tenant;
  }
  const currentTenant = lockedTenantRef.current;

  const fields = createTenantAdminFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!currentTenant) return;
    await createTenantAdminExecutor(t)({
      tenantCode: currentTenant.code,
      ...values,
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={currentTenant ? `admin-${currentTenant.code}` : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title={t('TenantMgmt.dialog.createAdmin', '创建租户管理员')}
      description={t(
        'TenantMgmt.dialog.createAdminDesc',
        '为租户「{name}」创建管理员账户',
        { name: currentTenant?.name ?? '' },
      )}
      fields={fields}
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { CreateAdminDialogProps };
export { CreateAdminDialog };
