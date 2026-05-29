import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import { buildDefaultValues, buildSchema, useAppForm } from '@/components/form';
import type { FieldConfig } from '@/components/form/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { ProForm } from './pro-form';

interface ProFormDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Field configurations */
  fields: FieldConfig[];
  /** Override schema. If not provided, built from fields[].rule */
  schema?: z.ZodTypeAny;
  /** Edit mode values. Merged with defaults */
  editValues?: Record<string, unknown> | null;
  /** Submit handler — called with form values on valid submit */
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  /** Number of form columns. Default: 2 */
  columns?: 1 | 2 | 3 | 4;
  /** Max dialog width class. Default: 'sm:max-w-[600px]' */
  maxWidth?: string;
  /** Custom footer. Defaults to Cancel + Confirm buttons */
  footer?: ReactNode;
}

function ProFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  schema,
  editValues,
  onSubmit,
  columns = 2,
  maxWidth = 'sm:max-w-[600px]',
  footer,
}: ProFormDialogProps) {
  const t = useT();
  const lockedValuesRef = useRef(editValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const touchedFieldsRef = useRef(new Set<string>());

  useEffect(() => {
    if (open) {
      setSubmitAttempted(false);
      touchedFieldsRef.current = new Set();
    }
  }, [open]);
  if (open) {
    lockedValuesRef.current = editValues;
  }
  const currentValues = lockedValuesRef.current;

  const effectiveSchema = schema ?? buildSchema(fields, t);
  const defaults = buildDefaultValues(fields);
  const mergedDefaults = currentValues
    ? { ...defaults, ...currentValues }
    : defaults;

  // TanStack Form's validator expects StandardSchemaV1 with input type matching
  // defaultValues. buildSchema returns ZodTypeAny-based shape whose ~standard
  // input resolves to `unknown`. This is safe because form values ARE strings/numbers/booleans.
  // Zod v4 doesn't export ZodTypeDef, so we cast through unknown for the validator binding.
  type FormValues = Record<
    string,
    string | number | boolean | null | undefined
  >;
  const form = useAppForm({
    validators: {
      onChange: effectiveSchema as unknown as {
        '~standard': {
          version: 1;
          vendor: string;
          validate: (
            value: unknown,
          ) => Promise<
            { value: FormValues } | { issues: Array<{ message: string }> }
          >;
          types: { input: FormValues; output: FormValues };
        };
      },
    },
    defaultValues: mergedDefaults,
    onSubmit: async ({ value }) => {
      await onSubmit(value as Record<string, unknown>);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-1 py-4">
          <form.Subscribe
            selector={(state: { values: Record<string, unknown> }) =>
              state.values
            }
          >
            {(formValues) => (
              <ProForm
                form={form}
                fields={fields}
                columns={columns}
                showAllErrors={submitAttempted}
                touchedFields={touchedFieldsRef.current}
                formValues={formValues}
              />
            )}
          </form.Subscribe>
        </div>

        <DialogFooter>
          {footer ?? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('Common.cancel', '取消')}
              </Button>
              <form.Subscribe
                selector={(state: {
                  isSubmitting: boolean;
                  canSubmit: boolean;
                }) => [state.isSubmitting, state.canSubmit]}
              >
                {([isSubmitting, canSubmit]) => (
                  <Button
                    onClick={() => {
                      setSubmitAttempted(true);
                      void form.handleSubmit();
                    }}
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting
                      ? t('Common.submitting', '提交中...')
                      : t('Common.confirm', '确认')}
                  </Button>
                )}
              </form.Subscribe>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ProFormDialogProps };
export { ProFormDialog };
