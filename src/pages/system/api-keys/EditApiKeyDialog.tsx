import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { ApiKeyResponse } from './options';
import { createEditApiKeyFormFields, updateApiKeyExecutor } from './options';

interface EditApiKeyDialogProps {
  open: boolean;
  apiKey: ApiKeyResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditApiKeyDialog = ({
  open,
  apiKey,
  onOpenChange,
  onSuccess,
}: EditApiKeyDialogProps) => {
  const t = useT();

  const lockedRef = useRef(apiKey);
  if (open) {
    lockedRef.current = apiKey;
  }
  const current = lockedRef.current;

  const fields = createEditApiKeyFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!current) return;
    await updateApiKeyExecutor(t)({ id: current.id, ...values });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={current ? `edit-${current.id}` : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title={t('ApiKeyMgmt.dialog.edit', '编辑 API Key')}
      description={t('ApiKeyMgmt.dialog.editDesc', '修改 API Key 名称和描述')}
      fields={fields}
      editValues={
        current
          ? {
              name: current.name,
              description: current.description ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { EditApiKeyDialogProps };
export { EditApiKeyDialog };
