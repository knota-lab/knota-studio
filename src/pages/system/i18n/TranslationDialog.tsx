import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import type { CustomRenderProps } from '@/components/form/types';
import { Input } from '@/components/ui/input';
import { useT } from '@/i18n';
import { toast } from '@/utils/toast';
import type { KeyEntry, LocaleAdmin } from './options';
import {
  createTranslationEditFields,
  editTranslationExecutor,
  importCurrentTenantOverrides,
} from './options';

interface TranslationDialogProps {
  open: boolean;
  entry: KeyEntry | null;
  locale: string | null;
  locales: LocaleAdmin[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isTenantOverride?: boolean;
}

const TranslationDialog = ({
  open,
  entry,
  locale,
  locales,
  onOpenChange,
  onSuccess,
  isTenantOverride = false,
}: TranslationDialogProps) => {
  const t = useT();
  const lockedEntryRef = useRef(entry);
  const lockedLocaleRef = useRef(locale);
  if (open) {
    lockedEntryRef.current = entry;
    lockedLocaleRef.current = locale;
  }
  const editEntry = lockedEntryRef.current;
  const editLocaleCode = lockedLocaleRef.current;

  const localeOptions = locales.map((l) => ({
    value: l.locale,
    label: `${l.label} (${l.locale})`,
  }));

  const fields = createTranslationEditFields(t).map((f) => {
    if (f.name === 'namespace' || f.name === 'key') {
      return {
        ...f,
        type: 'custom' as const,
        render: (props: CustomRenderProps) => (
          <Input
            value={(props.field as { value: string }).value ?? ''}
            disabled
            onChange={() => {}}
          />
        ),
      };
    }
    if (f.name === 'locale') {
      return { ...f, options: localeOptions };
    }
    return f;
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isTenantOverride) {
      await importCurrentTenantOverrides({
        scope: 'tenant',
        strategy: 'replace',
        entries: [
          {
            namespace: values.namespace as string,
            key: values.key as string,
            locale: values.locale as string,
            value: values.value as string,
          },
        ],
      });
      toast.success(t('I18nMgmt.toast.translationSaved', '更新成功'));
    } else {
      const cellData = editEntry?.byLocale[values.locale as string];
      await editTranslationExecutor(t)({ ...values, id: cellData?.id });
    }
    onSuccess();
    onOpenChange(false);
  };

  const currentValue =
    editEntry && editLocaleCode
      ? (editEntry.byLocale[editLocaleCode]?.value ?? '')
      : '';

  return (
    <ProFormDialog
      key={
        editEntry && editLocaleCode
          ? `edit-${editEntry.stableId}-${editLocaleCode}`
          : 'closed'
      }
      open={open}
      onOpenChange={onOpenChange}
      title={t('I18nMgmt.dialog.editTranslation', '编辑翻译')}
      description={t(
        'I18nMgmt.dialog.editTranslationDesc',
        `编辑 ${editEntry?.namespace ?? ''}.${editEntry?.key ?? ''} 的翻译值`,
      )}
      fields={fields}
      editValues={
        editEntry
          ? {
              namespace: editEntry.namespace,
              key: editEntry.key,
              locale: editLocaleCode ?? '',
              value: currentValue,
            }
          : null
      }
      columns={1}
      onSubmit={handleSubmit}
    />
  );
};

export type { TranslationDialogProps };
export { TranslationDialog };
