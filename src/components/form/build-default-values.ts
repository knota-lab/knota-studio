import type { FieldConfig } from './types';

const typeDefaults: Partial<Record<FieldConfig['type'], unknown>> = {
  text: '',
  password: '',
  textarea: '',
  number: undefined,
  date: undefined,
  datetime: undefined,
  tags: '',
  boolean: false,
  select: undefined,
  'remote-select': undefined,
  multiselect: undefined,
};

export const buildDefaultValues = (
  fields: FieldConfig[],
): Record<string, unknown> => {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.name] =
      field.defaultValue ?? typeDefaults[field.type] ?? undefined;
    return acc;
  }, {});
};
