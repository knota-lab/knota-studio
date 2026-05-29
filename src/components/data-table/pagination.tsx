import { Icon } from '@iconify/react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PaginationLink } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/i18n';
import { DEFAULT_PAGE_SIZE } from '@/types/common';

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

const DataTablePagination = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [DEFAULT_PAGE_SIZE, 50, 100, 200],
}: DataTablePaginationProps) => {
  const t = useT();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pages = getVisiblePages(page, totalPages);

  const [jumperValue, setJumperValue] = useState('');
  const jumperRef = useRef<HTMLInputElement>(null);

  const handleJumperSubmit = useCallback(() => {
    const target = Number.parseInt(jumperValue, 10);
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target);
    }
    setJumperValue('');
  }, [jumperValue, totalPages, page, onPageChange]);

  return (
    <div className="flex shrink-0 items-center justify-end gap-4 py-4">
      <span className="inline-flex items-center text-sm text-muted-foreground">
        {t('Common.total', `共 ${totalItems} 条`)}
        {onPageSizeChange && (
          <Select
            value={String(pageSize)}
            onValueChange={(v: string) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="ml-2 h-7 w-auto shrink-0 gap-1 border-none px-1 text-sm text-muted-foreground shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {t('Common.perPage', `${size} 条/页`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          <Icon icon="lucide:chevrons-left" className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon icon="lucide:chevron-left" className="size-4" />
        </Button>
        {pages.map((p, idx) =>
          p === '...' ? (
            <span
              key={`ellipsis-${String(idx)}`}
              className="flex size-8 items-center justify-center text-xs text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <PaginationLink
              key={p}
              isActive={p === page}
              onClick={() => p !== page && onPageChange(p)}
              className="size-8 cursor-pointer p-0 text-xs"
            >
              {p}
            </PaginationLink>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <Icon icon="lucide:chevron-right" className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <Icon icon="lucide:chevrons-right" className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{t('Common.goto', '跳至')}</span>
        <input
          ref={jumperRef}
          type="text"
          value={jumperValue}
          onChange={(e) => setJumperValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJumperSubmit()}
          className="h-7 w-12 rounded-md border bg-background px-2 text-center text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        <span>{t('Common.page', '页')}</span>
      </div>
    </div>
  );
};

/** Compute visible page numbers with ellipsis gaps. */
const getVisiblePages = (
  current: number,
  total: number,
): (number | '...')[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  if (rangeStart > 2) {
    pages.push('...');
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < total - 1) {
    pages.push('...');
  }

  if (pages[pages.length - 1] !== total) {
    pages.push(total);
  }

  return pages;
};

export type { DataTablePaginationProps };
export { DataTablePagination };
