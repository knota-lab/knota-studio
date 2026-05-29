import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import { useAuth } from '@/stores/auth';
import {
  createNotificationExecutor,
  createNotificationFormFields,
} from './options';

interface CreateNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateNotificationDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateNotificationDialogProps) => {
  const t = useT();
  const { user } = useAuth();

  const fields = createNotificationFormFields(
    t,
    user?.tenantCode,
    user?.isSuperAdmin,
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    const executor = createNotificationExecutor(t);
    await executor(values);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key="create-notification"
      open={open}
      onOpenChange={onOpenChange}
      title={t('NotificationMgmt.dialog.create', '发送通知')}
      description={t('NotificationMgmt.dialog.createDesc', '创建并发送新通知')}
      fields={fields}
      onSubmit={handleSubmit}
    />
  );
};

export type { CreateNotificationDialogProps };
export { CreateNotificationDialog };
