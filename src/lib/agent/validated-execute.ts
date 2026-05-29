import { toast } from 'sonner';
import { z } from 'zod';
import { buildSchema } from '@/components/form';
import type { FieldConfig } from '@/components/form/types';
import type { TFn } from '@/i18n';
import type { PageActionParam } from '@/stores/agent';

/**
 * Create a validated executor for form-based actions.
 * Validates values against FieldConfig[] via buildSchema, then calls the action.
 * Shows toast.success on completion.
 */
export function validatedFormAction(
  fields: FieldConfig[],
  t: TFn,
  action: (validated: Record<string, unknown>) => Promise<unknown>,
  successMessage: string,
): (values: Record<string, unknown>) => Promise<void> {
  return async (values) => {
    const schema = buildSchema(fields, t);
    const result = schema.safeParse(values);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message).join('; ');
      throw new Error(errors);
    }
    await action(result.data);
    toast.success(successMessage);
  };
}

/**
 * Create a validated executor for param-based actions (PageActionParam[]).
 * Auto-generates zod schema from param type + required.
 * Shows toast.success on completion.
 */
export function validatedParamAction(
  params: PageActionParam[],
  t: TFn,
  action: (validated: Record<string, unknown>) => Promise<unknown>,
  successMessage: string,
): (values: Record<string, unknown>) => Promise<void> {
  return async (values) => {
    const shape = params.reduce(
      (acc, param) => {
        let rule: z.ZodTypeAny;
        if (param.type === 'string' || param.type === 'select') {
          rule = z.string();
        } else if (param.type === 'number') {
          rule = z.number();
        } else {
          rule = z.boolean();
        }
        if (!param.required) {
          rule = rule.optional();
        } else if (rule instanceof z.ZodString) {
          rule = z
            .string()
            .min(1, t('Common.fieldRequired', `${param.label}必填`));
        }
        acc[param.name] = rule;
        return acc;
      },
      {} as Record<string, z.ZodTypeAny>,
    );
    const schema = z.object(shape);
    const result = schema.safeParse(values);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message).join('; ');
      throw new Error(errors);
    }
    await action(result.data);
    toast.success(successMessage);
  };
}
