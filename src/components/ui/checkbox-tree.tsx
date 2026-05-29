'use client';

import { Icon } from '@iconify/react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { Checkbox } from './checkbox';

export interface CheckboxTreeNode {
  key: string;
  label: string;
  /** Optional secondary text rendered below the label (e.g. action + route path). */
  description?: string;
  children?: CheckboxTreeNode[];
}

interface CheckboxTreeProps {
  tree: CheckboxTreeNode[];
  checkedKeys: Set<string>;
  onCheckedKeysChange: (keys: Set<string>) => void;
  defaultExpandAll?: boolean;
  checkStrictly?: boolean;
  className?: string;
}

interface TreeNodeRowProps {
  node: CheckboxTreeNode;
  depth: number;
  checkedKeys: Set<string>;
  onCheckedKeysChange: (keys: Set<string>) => void;
  expandedKeys: Set<string>;
  onExpandedKeysChange: (keys: Set<string>) => void;
  checkStrictly: boolean;
}

function collectDescendantKeys(node: CheckboxTreeNode): string[] {
  return (node.children ?? []).reduce<string[]>((acc, child) => {
    acc.push(child.key);
    acc.push(...collectDescendantKeys(child));
    return acc;
  }, []);
}

function collectParentKeys(nodes: CheckboxTreeNode[]): string[] {
  return nodes.reduce<string[]>((acc, node) => {
    if (node.children && node.children.length > 0) {
      acc.push(node.key);
      acc.push(...collectParentKeys(node.children));
    }
    return acc;
  }, []);
}

function TreeNodeRow({
  node,
  depth,
  checkedKeys,
  onCheckedKeysChange,
  expandedKeys,
  onExpandedKeysChange,
  checkStrictly,
}: TreeNodeRowProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);
  const isChecked = checkedKeys.has(node.key);

  const handleToggleExpand = useCallback(() => {
    const next = new Set(expandedKeys);
    if (next.has(node.key)) {
      next.delete(node.key);
    } else {
      next.add(node.key);
    }
    onExpandedKeysChange(next);
  }, [expandedKeys, node.key, onExpandedKeysChange]);

  const handleToggleCheck = useCallback(() => {
    const next = new Set(checkedKeys);
    if (next.has(node.key)) {
      next.delete(node.key);
      if (!checkStrictly && hasChildren) {
        collectDescendantKeys(node).forEach((k) => {
          next.delete(k);
        });
      }
    } else {
      next.add(node.key);
      if (!checkStrictly && hasChildren) {
        collectDescendantKeys(node).forEach((k) => {
          next.add(k);
        });
      }
    }
    onCheckedKeysChange(next);
  }, [checkedKeys, checkStrictly, hasChildren, node, onCheckedKeysChange]);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-accent mt-0.5 select-none"
            onClick={handleToggleExpand}
          >
            <Icon
              icon={isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'}
              className="size-4"
            />
          </button>
        ) : (
          <span className="inline-block size-5 shrink-0 select-none" />
        )}
        <Checkbox
          checked={isChecked}
          onCheckedChange={handleToggleCheck}
          className="mt-0.5 select-none"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm leading-snug">{node.label}</span>
          {node.description && (
            <span className="text-xs text-muted-foreground leading-snug">
              {node.description}
            </span>
          )}
        </div>
      </div>
      {hasChildren && isExpanded
        ? node.children?.map((child) => (
            <TreeNodeRow
              key={child.key}
              node={child}
              depth={depth + 1}
              checkedKeys={checkedKeys}
              onCheckedKeysChange={onCheckedKeysChange}
              expandedKeys={expandedKeys}
              onExpandedKeysChange={onExpandedKeysChange}
              checkStrictly={checkStrictly}
            />
          ))
        : null}
    </div>
  );
}

function CheckboxTree({
  tree,
  checkedKeys,
  onCheckedKeysChange,
  defaultExpandAll = false,
  checkStrictly = true,
  className,
}: CheckboxTreeProps) {
  const buildInitialExpanded = useCallback((): Set<string> => {
    if (!defaultExpandAll) {
      return new Set<string>();
    }
    return new Set(collectParentKeys(tree));
  }, [defaultExpandAll, tree]);

  const [expandedKeys, setExpandedKeys] =
    useState<Set<string>>(buildInitialExpanded);

  // When expandResetKey changes, sync expanded state to match defaultExpandAll
  // without causing a full component remount.
  useEffect(() => {
    setExpandedKeys(
      defaultExpandAll ? new Set(collectParentKeys(tree)) : new Set(),
    );
  }, [defaultExpandAll, tree]);

  return (
    <div className={cn(className)}>
      {tree.map((node) => (
        <TreeNodeRow
          key={node.key}
          node={node}
          depth={0}
          checkedKeys={checkedKeys}
          onCheckedKeysChange={onCheckedKeysChange}
          expandedKeys={expandedKeys}
          onExpandedKeysChange={setExpandedKeys}
          checkStrictly={checkStrictly}
        />
      ))}
    </div>
  );
}

export { CheckboxTree };
