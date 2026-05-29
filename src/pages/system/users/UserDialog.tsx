import { useRequest } from 'ahooks';
import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { UserResponse } from '@/types/user';
import {
  createUserEditFormFields,
  createUserExecutor,
  createUserFormFields,
  getAllTenants,
  updateUserExecutor,
} from './options';

interface UserDialogProps {
  open: boolean;
  user: UserResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UserDialog = ({
  open,
  user,
  onOpenChange,
  onSuccess,
}: UserDialogProps) => {
  const t = useT();

  // Lock edit user data
  const lockedUserRef = useRef(user);
  if (open) {
    lockedUserRef.current = user;
  }
  const editUser = lockedUserRef.current;
  const isEdit = !!editUser;

  const { data: tenantsData } = useRequest(getAllTenants, {
    ready: open && !isEdit,
    refreshDeps: [open],
  });

  const tenantOptions = (tenantsData?.items ?? []).map((item) => ({
    value: item.code,
    label: item.name,
  }));

  // Build create fields with dynamic tenant options
  const createFields = createUserFormFields(t).map((f) =>
    f.name === 'tenantCode' ? { ...f, options: tenantOptions } : f,
  );

  const fields = isEdit ? createUserEditFormFields(t) : createFields;

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateUserExecutor(t)({ id: editUser.id, ...values });
    } else {
      await createUserExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editUser.id}` : 'create'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('UserMgmt.dialog.editUser', '编辑用户')
          : t('UserMgmt.dialog.createUser', '新建用户')
      }
      description={
        isEdit
          ? t('UserMgmt.dialog.editUserDesc', '修改用户信息')
          : t('UserMgmt.dialog.createUserDesc', '填写用户信息创建新用户')
      }
      fields={fields}
      editValues={isEdit ? { name: editUser.name } : null}
      onSubmit={handleSubmit}
    />
  );
};

export type { UserDialogProps };
export { UserDialog };
