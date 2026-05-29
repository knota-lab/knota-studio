import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
}

interface TreeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Tree data — supports any shape with { id, name, children? } */
  tree: unknown[];
  /** ID of the item being edited (excluded from options) */
  excludeId?: string;
  placeholder?: string;
}

interface TreeNode {
  id: string;
  name: string;
  depth: number;
}

function flattenWithDepth(
  items: unknown[],
  depth: number,
  excludeId?: string,
): TreeNode[] {
  return (items as TreeNodeData[]).reduce<TreeNode[]>((acc, item) => {
    if (item.id !== excludeId) {
      acc.push({ id: item.id, name: item.name, depth });
    }
    if (item.children && item.children.length > 0) {
      acc.push(...flattenWithDepth(item.children, depth + 1, excludeId));
    }
    return acc;
  }, []);
}

const TreeSelect = ({
  value,
  onChange,
  tree,
  excludeId,
  placeholder,
}: TreeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedName = useMemo(() => {
    if (!value) return '';
    const found = flattenWithDepth(tree, 0).find((n) => n.id === value);
    return found?.name ?? '';
  }, [value, tree]);

  const nodes = useMemo(() => {
    const flat = flattenWithDepth(tree, 0, excludeId);
    if (!search.trim()) return flat;
    const term = search.toLowerCase();
    return flat.filter((n) => n.name.toLowerCase().includes(term));
  }, [tree, excludeId, search]);

  const handleSelect = (id: string) => {
    onChange?.(id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="group/button w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedName || (
              <span className="text-muted-foreground">
                {placeholder ?? '请选择'}
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
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          className="max-h-[300px] overflow-y-auto p-1"
          onWheel={(e) => e.stopPropagation()}
        >
          {nodes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              无匹配项
            </p>
          ) : (
            nodes.map((node) => {
              const isSelected = node.id === value;
              return (
                <div
                  key={node.id}
                  role="option"
                  tabIndex={0}
                  className={cn(
                    'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                    isSelected && 'bg-accent',
                  )}
                  style={{ paddingLeft: `${12 + node.depth * 16}px` }}
                  onClick={() => handleSelect(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelect(node.id);
                    }
                  }}
                >
                  {node.name}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { TreeSelect };
