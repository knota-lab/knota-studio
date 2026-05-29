import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { FieldConfig, FieldType } from './types';

/** Maps FieldType to registered form.AppField component name */
const FIELD_COMPONENT_MAP: Record<FieldType, string> = {
  text: 'TextField',
  password: 'PasswordField',
  textarea: 'TextAreaField',
  number: 'NumberField',
  boolean: 'BooleanField',
  select: 'SelectField',
  'remote-select': 'RemoteSelectField',
  date: 'TextField',
  datetime: 'TextField',
  dateRange: 'TextField',
  multiselect: 'MultiSelectField',
  tags: 'TextField',
  icon: 'IconField',
  'tree-select': 'TreeSelectField',
  custom: 'TextField',
};

const COLUMNS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const COL_SPAN_CLASS: Record<number, string> = {
  1: '',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
};

// TanStack Form's useFieldContext returns a field object with dynamically
// registered component methods (TextField, SelectField, etc.) plus state.
// biome-ignore lint/suspicious/noExplicitAny: TanStack Form dynamic field API
type FieldApi = Record<string, any>;

interface ProFormProps {
  /** The useAppForm() instance */
  // TanStack Form's AppField returns ReactNode | Promise<ReactNode> internally
  // biome-ignore lint/suspicious/noExplicitAny: TanStack Form dynamic form API
  form: any;
  /** Field configurations */
  fields: FieldConfig[];
  /** Number of columns. Default: 2 */
  columns?: 1 | 2 | 3 | 4;
  /** Additional CSS class */
  className?: string;
  /** Show errors for all fields (after submit attempt). Default: only touched fields */
  showAllErrors?: boolean;
  /** Externally managed touched fields set. Falls back to TanStack Form's isTouched if not provided */
  touchedFields?: Set<string>;
  /** Current form values — passed reactively via form.Subscribe */
  formValues?: Record<string, unknown>;
}

function ProForm({
  form,
  fields,
  columns = 2,
  className,
  showAllErrors,
  touchedFields,
  formValues = {},
}: ProFormProps) {
  const gridClass = COLUMNS_CLASS[columns] ?? 'grid-cols-2';

  return (
    <div className={cn('grid gap-x-4 gap-y-3', gridClass, className)}>
      {fields.map((fieldConfig) => {
        // showWhen: hide field if condition not met
        if (fieldConfig.showWhen) {
          const { field, value } = fieldConfig.showWhen;
          const currentVal = formValues[field];
          const isVisible = Array.isArray(value)
            ? value.includes(currentVal)
            : currentVal === value;
          if (!isVisible) return null;
        }
        const componentName = FIELD_COMPONENT_MAP[fieldConfig.type];
        const colSpan = fieldConfig.colSpan ?? 1;
        const spanClass = COL_SPAN_CLASS[colSpan] ?? '';

        // Custom render
        if (fieldConfig.type === 'custom' && fieldConfig.render) {
          return (
            <div key={fieldConfig.name} className={cn('grid gap-2', spanClass)}>
              <Label>
                {fieldConfig.label}
                {fieldConfig.required && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              {fieldConfig.render({ field: form, config: fieldConfig })}
            </div>
          );
        }

        return (
          <div key={fieldConfig.name} className={cn('grid gap-2', spanClass)}>
            <form.AppField
              name={fieldConfig.name}
              listeners={{
                onBlur: () => {
                  touchedFields?.add(fieldConfig.name);
                },
              }}
            >
              {(field: FieldApi) => {
                const Component = field[componentName];
                if (!Component) return null;

                const errors = field.state.meta.errors;
                const isFieldTouched = touchedFields
                  ? touchedFields.has(fieldConfig.name)
                  : field.state.meta.isTouched;
                const hasError =
                  errors.length > 0 && (showAllErrors || isFieldTouched);
                const errorMessage = hasError
                  ? errors
                      .map((e: unknown) =>
                        typeof e === 'string'
                          ? e
                          : ((e as { message?: string })?.message ?? ''),
                      )
                      .filter(Boolean)
                      .join(', ')
                  : '';

                const labelContent = hasError ? (
                  <span className="text-destructive">{errorMessage}</span>
                ) : (
                  <>
                    {fieldConfig.label}
                    {fieldConfig.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </>
                );

                if (fieldConfig.type === 'boolean') {
                  return (
                    <>
                      <Label>
                        {fieldConfig.label}
                        {fieldConfig.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      <Component />
                    </>
                  );
                }

                const config: Record<string, unknown> = {};
                if (fieldConfig.placeholder) {
                  config.placeholder = fieldConfig.placeholder;
                }
                if (fieldConfig.options) {
                  config.options = fieldConfig.options;
                }
                if (fieldConfig.remote) {
                  config.remote = fieldConfig.remote;
                }
                if (fieldConfig.treeItems) {
                  config.treeItems = fieldConfig.treeItems;
                }

                return (
                  <>
                    <Label>{labelContent}</Label>
                    <Component config={config} />
                  </>
                );
              }}
            </form.AppField>
          </div>
        );
      })}
    </div>
  );
}

export type { ProFormProps };
export { ProForm };
