import { useMemo, useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { PermissionResponse } from '@/types/permission';
import { createPermEditFields, updatePermissionExecutor } from './options';

interface PermissionDialogProps {
  open: boolean;
  permission: PermissionResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PermissionDialog = ({
  open,
  permission,
  onOpenChange,
  onSuccess,
}: PermissionDialogProps) => {
  const t = useT();
  const lockedPermissionRef = useRef(permission);
  if (open) {
    lockedPermissionRef.current = permission;
  }
  const editPermission = lockedPermissionRef.current;

  const editFields = useMemo(() => createPermEditFields(t), [t]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!editPermission) return;
    const executor = updatePermissionExecutor(t);
    await executor({
      id: editPermission.id,
      version: editPermission.version,
      ...values,
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={editPermission ? `edit-${editPermission.id}` : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title={t('PermMgmt.dialog.edit', '编辑权限')}
      description={t('PermMgmt.dialog.editDesc', '修改权限信息')}
      fields={editFields}
      editValues={
        editPermission
          ? {
              name: editPermission.name,
              code: editPermission.code,
              obj: editPermission.obj,
              act: editPermission.act,
              permissionType: editPermission.permissionType,
              isSystem: editPermission.isSystem,
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { PermissionDialogProps };
export { PermissionDialog };
