import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import type { FieldConfig } from '@/components/form/types';
import { Input } from '@/components/ui/input';
import { useT } from '@/i18n';
import type { LocaleAdmin } from './options';
import {
  createLocaleExecutor,
  createLocaleFormFields,
  updateLocaleExecutor,
} from './options';

interface LocaleDialogProps {
  open: boolean;
  locale: LocaleAdmin | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LocaleDialog = ({
  open,
  locale,
  onOpenChange,
  onSuccess,
}: LocaleDialogProps) => {
  const t = useT();
  const lockedLocaleRef = useRef(locale);
  if (open) {
    lockedLocaleRef.current = locale;
  }
  const editLocale = lockedLocaleRef.current;

  const isEdit = !!editLocale;

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateLocaleExecutor(t)({ locale: editLocale.locale, ...values });
    } else {
      await createLocaleExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  const editFields = isEdit
    ? createLocaleFormFields(t).map((field) =>
        field.name === 'locale'
          ? {
              ...field,
              render: ({
                field: formField,
              }: {
                field: unknown;
                config: FieldConfig;
              }) => (
                <Input
                  value={(formField as { value: string }).value ?? ''}
                  disabled
                  onChange={() => {}}
                />
              ),
            }
          : field,
      )
    : createLocaleFormFields(t);

  return (
    <ProFormDialog
      key={editLocale ? `edit-${editLocale.locale}` : 'create'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('I18nMgmt.dialog.editLocale', '编辑语言')
          : t('I18nMgmt.dialog.createLocale', '新建语言')
      }
      description={
        isEdit
          ? t('I18nMgmt.dialog.editLocaleDesc', '修改语言配置')
          : t('I18nMgmt.dialog.createLocaleDesc', '添加新的语言支持')
      }
      fields={editFields}
      editValues={
        editLocale
          ? {
              locale: editLocale.locale,
              label: editLocale.label,
              isEnabled: editLocale.isEnabled,
              sortOrder: editLocale.sortOrder,
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { LocaleDialogProps };
export { LocaleDialog };
