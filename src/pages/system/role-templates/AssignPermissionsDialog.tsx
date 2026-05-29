import { useRequest } from 'ahooks';
import { useMemo, useRef, useState } from 'react';
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
import type { PermissionWithMetadata } from '@/types/permission';
import type { TemplatePermissionItem } from '@/types/role-template';
import {
  assignTemplatePermissionsExecutor,
  getPermissionsWithMetadata,
  getTemplatePermissions,
} from './options';

interface AssignPermissionsDialogProps {
  open: boolean;
  templateId: string | null;
  templateName: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function buildPermissionTree(
  permissions: PermissionWithMetadata[],
): CheckboxTreeNode[] {
  const grouped = permissions.reduce<Map<string, PermissionWithMetadata[]>>(
    (acc, perm) => {
      const tag = perm.tag;
      const list = acc.get(tag) ?? [];
      list.push(perm);
      acc.set(tag, list);
      return acc;
    },
    new Map(),
  );

  const tree: CheckboxTreeNode[] = [];
  grouped.forEach((perms, tag) => {
    tree.push({
      key: `tag:${tag}`,
      label: tag,
      children: perms.map((p) => ({
        key: `${p.obj}:${p.act}`,
        label: p.name || `${p.obj}:${p.act}`,
      })),
    });
  });

  return tree;
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

function AssignPermissionsDialog({
  open,
  templateId,
  templateName,
  onOpenChange,
  onSuccess,
}: AssignPermissionsDialogProps) {
  const t = useT();

  const lockedIdRef = useRef(templateId);
  if (open) {
    lockedIdRef.current = templateId;
  }
  const lockedId = lockedIdRef.current;

  const { data: permsData, loading: permsLoading } = useRequest(
    getPermissionsWithMetadata,
    { manual: !open },
  );

  const { data: templatePermsData, loading: templatePermsLoading } = useRequest(
    () => (lockedId ? getTemplatePermissions(lockedId) : Promise.resolve(null)),
    {
      manual: !open || !lockedId,
      refreshDeps: [lockedId],
    },
  );

  const permissions = permsData?.permissions ?? [];
  const tree = useMemo(() => buildPermissionTree(permissions), [permissions]);

  const initialKeys = useMemo(
    () =>
      new Set(
        (templatePermsData ?? []).map(
          (item: TemplatePermissionItem) => `${item.obj}:${item.act}`,
        ),
      ),
    [templatePermsData],
  );

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(initialKeys);

  const allKeys = collectAllTreeKeys(tree);

  const handleSelectAll = () => {
    setCheckedKeys(new Set(allKeys));
  };

  const handleInvert = () => {
    const next = new Set<string>();
    allKeys.forEach((key) => {
      if (!checkedKeys.has(key)) {
        next.add(key);
      }
    });
    setCheckedKeys(next);
  };

  const handleSave = () => {
    if (!lockedId) {
      return;
    }
    const permKeys: string[] = [];
    checkedKeys.forEach((key) => {
      if (key.startsWith('tag:')) {
        return;
      }
      if (key.split(':').length >= 2) {
        permKeys.push(key);
      }
    });

    assignTemplatePermissionsExecutor(t)({
      templateId: lockedId,
      permissions: permKeys.join(','),
    })
      .then(() => {
        onSuccess();
        onOpenChange(false);
      })
      .catch(() => {
        // executor handles validation errors via throw
      });
  };

  const loading = permsLoading || templatePermsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              'RoleTemplateMgmt.assignPerms.title',
              '分配权限 - {name}',
            ).replace('{name}', templateName)}
          </DialogTitle>
          <DialogDescription>
            {t('RoleTemplateMgmt.assignPerms.desc', '为角色模板分配操作权限')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {t('RoleTemplateMgmt.assignPerms.selectAll', '全选')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleInvert}>
            {t('RoleTemplateMgmt.assignPerms.invert', '反选')}
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded-md border p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t('RoleTemplateMgmt.assignPerms.loading', '加载中...')}
            </div>
          ) : (
            <CheckboxTree
              tree={tree}
              checkedKeys={checkedKeys}
              onCheckedKeysChange={setCheckedKeys}
              defaultExpandAll
              checkStrictly
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('RoleTemplateMgmt.assignPerms.cancel', '取消')}
          </Button>
          <Button onClick={handleSave}>
            {t('RoleTemplateMgmt.assignPerms.save', '保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { AssignPermissionsDialogProps };
export { AssignPermissionsDialog };
