import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import {
  createSuperAdminExecutor,
  createSuperAdminFormFields,
} from './options';

interface SuperAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SuperAdminDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: SuperAdminDialogProps) => {
  const t = useT();

  const fields = createSuperAdminFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    await createSuperAdminExecutor(t)(values);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key="super-admin"
      open={open}
      onOpenChange={onOpenChange}
      title={t('UserMgmt.dialog.createSuperAdmin', '创建超级管理员')}
      description={t(
        'UserMgmt.dialog.createSuperAdminDesc',
        '创建具有系统最高权限的超级管理员账户',
      )}
      fields={fields}
      onSubmit={handleSubmit}
    />
  );
};

export type { SuperAdminDialogProps };
export { SuperAdminDialog };
