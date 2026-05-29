import { z } from 'zod';
import type { TFn } from '@/i18n';
import type { FieldConfig, FieldType } from './types';

/** Build a zod validator for a field based on its type and required flag. */
const buildFieldRule = (field: FieldConfig, t: TFn): z.ZodTypeAny => {
  // Explicit rule takes priority
  if (field.rule) return field.rule;

  const typeRules: Partial<Record<FieldType, () => z.ZodTypeAny>> = {
    text: () => z.string(),
    password: () => z.string(),
    textarea: () => z.string(),
    number: () => z.number(),
    boolean: () => z.boolean(),
    select: () => z.string(),
    'remote-select': () => z.string(),
    multiselect: () => z.array(z.string()),
    tags: () => z.string(),
    icon: () => z.string(),
    date: () => z.string(),
    datetime: () => z.string(),
    dateRange: () => z.string(),
    custom: () => z.unknown(),
  };

  const builder = typeRules[field.type];
  const base = builder ? builder() : z.unknown();

  // Non-required fields accept undefined
  // Fields with showWhen are conditionally visible — treat as optional in schema;
  // the UI hides them and the backend validates based on notificationType
  if (!field.required || field.showWhen) {
    return base.optional();
  }

  // Required strings: min(1) to prevent empty input
  if (base instanceof z.ZodString) {
    return z.string().min(1, t('Common.fieldRequired', `${field.label}必填`));
  }

  return base;
};

export const buildSchema = (fields: FieldConfig[], t: TFn) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.reduce((acc, field) => {
    acc[field.name] = buildFieldRule(field, t);
    return acc;
  }, shape);

  return z.object(shape).passthrough();
};
