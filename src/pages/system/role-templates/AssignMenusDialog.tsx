import { useRequest } from 'ahooks';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CheckboxTreeNode } from '@/components/ui/checkbox-tree';
import { CheckboxTree } from '@/components/ui/checkbox-tree';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/i18n';
import type { SysMenuTreeResponse } from '@/types/api';
import {
  assignTemplateMenusExecutor,
  getSysMenuTree,
  getTemplateMenuIds,
} from './options';

interface AssignMenusDialogProps {
  open: boolean;
  templateId: string | null;
  templateName: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function convertMenuTree(items: SysMenuTreeResponse[]): CheckboxTreeNode[] {
  return items.map((item) => ({
    key: item.id,
    label: item.name,
    children:
      item.children.length > 0 ? convertMenuTree(item.children) : undefined,
  }));
}

function collectAllTreeKeys(nodes: CheckboxTreeNode[]): string[] {
  return nodes.reduce<string[]>((acc, node) => {
    acc.push(node.key);
    if (node.children) {
      acc.push(...collectAllTreeKeys(node.children));
    }
    return acc;
  }, []);
}

function AssignMenusDialog({
  open,
  templateId,
  templateName,
  onOpenChange,
  onSuccess,
}: AssignMenusDialogProps) {
  const t = useT();

  const lockedIdRef = useRef(templateId);
  if (open) {
    lockedIdRef.current = templateId;
  }
  const lockedId = lockedIdRef.current;

  const { data: menuTreeData, loading: menuTreeLoading } = useRequest(
    getSysMenuTree,
    {
      manual: !open,
    },
  );

  const { data: menuIdsData, loading: menuIdsLoading } = useRequest(
    () => (lockedId ? getTemplateMenuIds(lockedId) : Promise.resolve(null)),
    {
      manual: !open || !lockedId,
      refreshDeps: [lockedId],
    },
  );

  const menuTree = menuTreeData ?? [];
  const convertedTree = convertMenuTree(menuTree);
  const initialKeys = new Set(menuIdsData?.sysMenuIds ?? []);

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(initialKeys);

  const allKeys = collectAllTreeKeys(convertedTree);

  const handleSelectAll = () => {
    setCheckedKeys(new Set(allKeys));
  };

  const handleClearAll = () => {
    setCheckedKeys(new Set<string>());
  };

  const handleSave = () => {
    if (!lockedId) {
      return;
    }
    assignTemplateMenusExecutor(t)({
      templateId: lockedId,
      sysMenuIds: Array.from(checkedKeys).join(','),
    })
      .then(() => {
        onSuccess();
        onOpenChange(false);
      })
      .catch(() => {
        // executor handles validation errors via throw
      });
  };

  const loading = menuTreeLoading || menuIdsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              'RoleTemplateMgmt.assignMenus.title',
              '分配菜单 - {name}',
            ).replace('{name}', templateName)}
          </DialogTitle>
          <DialogDescription>
            {t(
              'RoleTemplateMgmt.assignMenus.desc',
              '为角色模板分配可访问的系统菜单',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {t('RoleTemplateMgmt.assignMenus.selectAll', '全选')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            {t('RoleTemplateMgmt.assignMenus.clearAll', '清空')}
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded-md border p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t('RoleTemplateMgmt.assignMenus.loading', '加载中...')}
            </div>
          ) : (
            <CheckboxTree
              tree={convertedTree}
              checkedKeys={checkedKeys}
              onCheckedKeysChange={setCheckedKeys}
              defaultExpandAll
              checkStrictly
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('RoleTemplateMgmt.assignMenus.cancel', '取消')}
          </Button>
          <Button onClick={handleSave}>
            {t('RoleTemplateMgmt.assignMenus.save', '保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { AssignMenusDialogProps };
export { AssignMenusDialog };
