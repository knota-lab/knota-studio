import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { UserResponse } from '@/types/user';
import {
  createResetPasswordFormFields,
  resetPasswordExecutor,
} from './options';

interface ResetPasswordDialogProps {
  open: boolean;
  user: UserResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ResetPasswordDialog = ({
  open,
  user,
  onOpenChange,
  onSuccess,
}: ResetPasswordDialogProps) => {
  const t = useT();

  const fields = createResetPasswordFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!user) return;
    await resetPasswordExecutor(t)({
      userId: user.id,
      password: values.newPassword,
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={user ? `reset-${user.id}` : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title={t('UserMgmt.dialog.resetPassword', '重置密码')}
      description={t(
        'UserMgmt.dialog.resetPasswordDesc',
        '为用户 {name} 设置新密码',
        { name: user?.name ?? '' },
      )}
      fields={fields}
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { ResetPasswordDialogProps };
export { ResetPasswordDialog };
