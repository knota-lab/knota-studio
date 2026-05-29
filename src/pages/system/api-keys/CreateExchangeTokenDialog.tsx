import dayjs from 'dayjs';
import { useState } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { SmartDateInput } from '@/components/ui/smart-date-input';
import { useT } from '@/i18n';
import type { CreateExchangeTokenResponse } from './options';
import { createExchangeToken, createExchangeTokenFormFields } from './options';

interface CreateExchangeTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: CreateExchangeTokenResponse) => void;
  roleOptions: { value: string; label: string }[];
}

const CreateExchangeTokenDialog = ({
  open,
  onOpenChange,
  onSuccess,
  roleOptions,
}: CreateExchangeTokenDialogProps) => {
  const t = useT();

  const [apiKeyExpiresAt, setApiKeyExpiresAt] = useState('');

  const fields = createExchangeTokenFormFields(t).map((f) => {
    if (f.name === 'roleId') return { ...f, options: roleOptions };
    if (f.name === 'apiKeyExpiresAt') {
      return {
        ...f,
        type: 'custom' as const,
        render: () => (
          <SmartDateInput
            value={apiKeyExpiresAt || undefined}
            onChange={(val) => setApiKeyExpiresAt(val ?? '')}
            placeholder={t(
              'ApiKeyMgmt.placeholder.apiKeyExpiresAt',
              '留空则永久有效，如：+30d、2025-12-31',
            )}
          />
        ),
      };
    }
    return f;
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    const res = await createExchangeToken({
      name: values.name as string,
      roleId: values.roleId as string,
      description: (values.description as string) || undefined,
      apiKeyExpiresAt: apiKeyExpiresAt
        ? dayjs(apiKeyExpiresAt).toISOString()
        : undefined,
      maxUsage: values.maxUsage as number,
    });
    onSuccess(res);
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key="create-exchange-token"
      open={open}
      onOpenChange={onOpenChange}
      title={t('ApiKeyMgmt.action.createToken', '创建兑换令牌')}
      description={t(
        'ApiKeyMgmt.dialog.createTokenDesc',
        '创建新的兑换令牌，生成后令牌仅显示一次',
      )}
      fields={fields}
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { CreateExchangeTokenDialogProps };
export { CreateExchangeTokenDialog };
