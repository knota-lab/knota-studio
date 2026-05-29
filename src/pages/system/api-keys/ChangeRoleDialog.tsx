import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { ApiKeyResponse } from './options';
import {
  changeApiKeyRoleExecutor,
  createChangeRoleFormFields,
} from './options';

interface ChangeRoleDialogProps {
  open: boolean;
  apiKey: ApiKeyResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  roleOptions: { value: string; label: string }[];
  rolesLoading: boolean;
}

const ChangeRoleDialog = ({
  open,
  apiKey,
  onOpenChange,
  onSuccess,
  roleOptions,
  rolesLoading,
}: ChangeRoleDialogProps) => {
  const t = useT();

  const lockedRef = useRef(apiKey);
  if (open) {
    lockedRef.current = apiKey;
  }
  const current = lockedRef.current;

  const fields = createChangeRoleFormFields(t).map((f) =>
    f.name === 'roleId' ? { ...f, options: roleOptions } : f,
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    await changeApiKeyRoleExecutor(t)({
      apiKeyId: current?.id ?? '',
      roleId: values.roleId as string,
    });
    onSuccess();
    onOpenChange(false);
  };

  if (rolesLoading) return null;

  return (
    <ProFormDialog
      key={current ? `role-${current.id}` : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title={t('ApiKeyMgmt.action.changeRole', '换绑角色')}
      description={t(
        'ApiKeyMgmt.dialog.changeRoleDesc',
        '为 API Key 更换绑定角色',
      )}
      fields={fields}
      editValues={current ? { roleId: current.roleId ?? '' } : null}
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { ChangeRoleDialogProps };
export { ChangeRoleDialog };
