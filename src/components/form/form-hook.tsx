import { Icon } from '@iconify/react';
import { createFormHook } from '@tanstack/react-form';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { IconPicker } from '@/components/ui/icon-picker';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { TreeSelect } from '@/components/ui/tree-select';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from './form-context';

const TextField = ({ config }: { config: { placeholder?: string } }) => {
  const field = useFieldContext<string>();

  return (
    <Input
      placeholder={config.placeholder}
      value={field.state.value ?? ''}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      aria-invalid={field.state.meta.errors.length > 0}
    />
  );
};

const PasswordField = ({ config }: { config: { placeholder?: string } }) => {
  const field = useFieldContext<string>();

  return (
    <Input
      type="password"
      placeholder={config.placeholder}
      value={field.state.value ?? ''}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      aria-invalid={field.state.meta.errors.length > 0}
    />
  );
};

const TextAreaField = ({ config }: { config: { placeholder?: string } }) => {
  const field = useFieldContext<string>();

  return (
    <textarea
      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      placeholder={config.placeholder}
      value={field.state.value ?? ''}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      aria-invalid={field.state.meta.errors.length > 0}
    />
  );
};

const NumberField = ({ config }: { config: { placeholder?: string } }) => {
  const field = useFieldContext<number>();

  return (
    <Input
      type="number"
      placeholder={config.placeholder}
      value={field.state.value ?? ''}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
      aria-invalid={field.state.meta.errors.length > 0}
    />
  );
};

const BooleanField = () => {
  const field = useFieldContext<boolean>();

  return (
    <Switch
      checked={field.state.value ?? false}
      onCheckedChange={(checked) => field.handleChange(checked)}
    />
  );
};

const SelectField = ({
  config,
}: {
  config: {
    options?: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
  };
}) => {
  const field = useFieldContext<string>();
  const t = useT();
  const [open, setOpen] = useState(false);
  const options = config.options ?? [];
  const selected = options.find((opt) => opt.value === field.state.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected?.label ?? field.state.value ?? (
            <span className="text-muted-foreground">
              {config.placeholder ?? t('Common.select', '请选择')}
            </span>
          )}
          <Icon
            icon="lucide:chevrons-up-down"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={config.placeholder ?? t('Common.search', '搜索...')}
          />
          <CommandList>
            <CommandEmpty>{t('Common.noMatch', '无匹配项')}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  disabled={opt.disabled}
                  onSelect={() => {
                    field.handleChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Icon
                    icon="lucide:check"
                    className={cn(
                      'mr-2 h-4 w-4',
                      opt.value === field.state.value
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const MultiSelectField = ({
  config,
}: {
  config: {
    options?: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
    remote?: {
      resolver: (
        keyword: string,
      ) => Promise<{ value: string; label: string }[]>;
    };
  };
}) => {
  const field = useFieldContext<string[]>();
  const t = useT();
  const [open, setOpen] = useState(false);

  const { data: remoteOptions } = useRequest(
    () => (config.remote ? config.remote.resolver('') : Promise.resolve([])),
    { cacheKey: 'multiselect-remote', refreshDeps: [config.remote] },
  );

  const options = (config.options ?? remoteOptions ?? []) as Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  const selected = field.state.value ?? [];

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    field.handleChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected.length > 0 ? (
            <span className="truncate">
              {selected.length === 1
                ? (options.find((o) => o.value === selected[0])?.label ??
                  selected[0])
                : t('Common.selectedCount', '已选 {{count}} 项', {
                    count: selected.length,
                  })}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {config.placeholder ?? t('Common.select', '请选择')}
            </span>
          )}
          <Icon
            icon="lucide:chevrons-up-down"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={config.placeholder ?? t('Common.search', '搜索...')}
          />
          <CommandList>
            <CommandEmpty>{t('Common.noMatch', '无匹配项')}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    disabled={opt.disabled ?? false}
                    onSelect={() => toggle(opt.value)}
                  >
                    <Icon
                      icon={isChecked ? 'lucide:check-square' : 'lucide:square'}
                      className={cn(
                        'mr-2 h-4 w-4',
                        isChecked ? 'opacity-100' : 'opacity-40',
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const RemoteSelectField = ({
  config,
}: {
  config: { placeholder?: string };
}) => {
  const field = useFieldContext<string>();
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {field.state.value ?? (
            <span className="text-muted-foreground">
              {config.placeholder ?? t('Common.select', '请选择')}
            </span>
          )}
          <Icon
            icon="lucide:chevrons-up-down"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={config.placeholder ?? t('Common.search', '搜索...')}
          />
          <CommandList>
            <CommandEmpty>{t('Common.noMatch', '无匹配项')}</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const IconField = ({ config }: { config: { placeholder?: string } }) => {
  const field = useFieldContext<string>();

  return (
    <IconPicker
      value={field.state.value ?? ''}
      onChange={(value) => field.handleChange(value)}
      placeholder={config.placeholder}
    />
  );
};

const TreeSelectField = ({
  config,
}: {
  config: { placeholder?: string; treeItems?: unknown[] };
}) => {
  const field = useFieldContext<string>();

  return (
    <TreeSelect
      value={field.state.value ?? ''}
      onChange={(value) => field.handleChange(value)}
      tree={config.treeItems ?? []}
      placeholder={config.placeholder}
    />
  );
};

const SubmitButton = () => {
  const form = useFormContext();
  const t = useT();

  return (
    <form.Subscribe
      selector={(state: { isSubmitting: boolean; canSubmit: boolean }) => [
        state.isSubmitting,
        state.canSubmit,
      ]}
    >
      {([isSubmitting, canSubmit]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting
            ? t('Common.submitting', '提交中...')
            : t('Common.submit', '提交')}
        </Button>
      )}
    </form.Subscribe>
  );
};

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    PasswordField,
    TextAreaField,
    NumberField,
    BooleanField,
    SelectField,
    MultiSelectField,
    RemoteSelectField,
    IconField,
    TreeSelectField,
  },
  fieldContext,
  formContext,
  formComponents: {
    SubmitButton,
  },
});
