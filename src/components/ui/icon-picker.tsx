import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { getLucideIconNames, lucideIcon } from '@/lib/utils/icons';

interface DynamicIconProps {
  name: string;
  className?: string;
}

const DynamicIcon = ({ name, className }: DynamicIconProps) => {
  return <Icon icon={lucideIcon(name)} className={className} />;
};

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const ICON_PAGE_SIZE = 50;

const IconPicker = ({ value, onChange, placeholder }: IconPickerProps) => {
  const t = useT();
  const resolvedPlaceholder =
    placeholder ?? t('Common.pickIcon', '选择图标...');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const allNames = useMemo(() => getLucideIconNames(), []);

  const filteredNames = useMemo(() => {
    const keyword = search.toLowerCase();
    return keyword
      ? allNames.filter((name) => name.toLowerCase().includes(keyword))
      : allNames;
  }, [search, allNames]);

  const totalPages = Math.ceil(filteredNames.length / ICON_PAGE_SIZE);
  const safePage = Math.min(page, totalPages) || 1;
  const pagedNames = useMemo(
    () =>
      filteredNames.slice(
        (safePage - 1) * ICON_PAGE_SIZE,
        safePage * ICON_PAGE_SIZE,
      ),
    [filteredNames, safePage],
  );

  const handleSelect = (iconName: string) => {
    onChange?.(iconName);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
      setPage(1);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="group/button w-full justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            {value ? (
              <>
                <DynamicIcon name={value} className="h-4 w-4 shrink-0" />
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {resolvedPlaceholder}
              </span>
            )}
          </span>
          <span className="shrink-0">
            {value ? (
              <>
                <Icon
                  icon="lucide:chevrons-up-down"
                  className="h-4 w-4 opacity-50 group-hover/button:hidden"
                />
                <Icon
                  icon="lucide:x"
                  className="!pointer-events-auto hidden h-4 w-4 cursor-pointer opacity-70 hover:opacity-100 group-hover/button:block"
                  onClick={handleClear}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              </>
            ) : (
              <Icon
                icon="lucide:chevrons-up-down"
                className="h-4 w-4 opacity-50"
              />
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Icon
            icon="lucide:search"
            className="mr-2 h-4 w-4 shrink-0 opacity-50"
          />
          <input
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={t('Common.searchIcon', '搜索图标...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div
          className="max-h-[300px] overflow-y-auto p-1"
          onWheel={(e) => e.stopPropagation()}
        >
          {filteredNames.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('Common.noIconMatch', '无匹配图标')}
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-1">
              {pagedNames.map((iconName) => {
                const isSelected = iconName === value;
                return (
                  <div
                    key={iconName}
                    role="option"
                    tabIndex={0}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-md p-2 cursor-pointer hover:bg-accent',
                      isSelected && 'bg-accent',
                    )}
                    onClick={() => handleSelect(iconName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelect(iconName);
                      }
                    }}
                  >
                    <Icon
                      icon={`lucide:${iconName}`}
                      className="h-5 w-5 shrink-0"
                    />
                    <span className="w-full truncate text-center text-[10px] leading-tight">
                      {iconName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 border-t px-2 py-1.5 text-sm">
            <Button
              variant="ghost"
              size="xs"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <Icon icon="lucide:chevron-left" className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground">
              {safePage}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="xs"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <Icon icon="lucide:chevron-right" className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export type { DynamicIconProps, IconPickerProps };
export { DynamicIcon, IconPicker };
