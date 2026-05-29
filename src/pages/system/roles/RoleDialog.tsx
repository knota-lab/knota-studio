import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { RoleResponse } from '@/types/user';
import {
  createRoleEditFormFields,
  createRoleExecutor,
  createRoleFormFields,
  updateRoleExecutor,
} from './options';

interface RoleDialogProps {
  open: boolean;
  role: RoleResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RoleDialog = ({
  open,
  role,
  onOpenChange,
  onSuccess,
}: RoleDialogProps) => {
  const t = useT();

  const lockedRoleRef = useRef(role);
  if (open) {
    lockedRoleRef.current = role;
  }
  const editRole = lockedRoleRef.current;
  const isEdit = !!editRole;

  const fields = isEdit ? createRoleEditFormFields(t) : createRoleFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateRoleExecutor(t)({
        ...values,
        id: editRole.id,
        version: editRole.version,
      });
    } else {
      await createRoleExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editRole.id}` : 'create'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('RoleMgmt.dialog.edit', '编辑角色')
          : t('RoleMgmt.dialog.create', '新建角色')
      }
      description={
        isEdit
          ? t('RoleMgmt.dialog.editDesc', '修改角色信息')
          : t('RoleMgmt.dialog.createDesc', '填写角色信息创建新角色')
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              name: editRole.name,
              description: editRole.description ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { RoleDialogProps };
export { RoleDialog };
