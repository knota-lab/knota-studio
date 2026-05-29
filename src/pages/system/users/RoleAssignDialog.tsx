import { useRequest } from 'ahooks';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useT } from '@/i18n';
import type { UserResponse } from '@/types/user';
import { toast } from '@/utils/toast';
import { getRolesByTenant, getUserRoles, syncUserRoles } from './options';

interface RoleAssignDialogProps {
  open: boolean;
  user: UserResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RoleAssignDialog = ({
  open,
  user,
  onOpenChange,
  onSuccess,
}: RoleAssignDialogProps) => {
  const t = useT();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data: rolesData, loading: rolesLoading } = useRequest(
    () => getRolesByTenant(user?.tenantCode ?? ''),
    {
      ready: open && !!user,
      refreshDeps: [open],
    },
  );

  useRequest(() => getUserRoles(user?.id ?? ''), {
    ready: open && !!user,
    refreshDeps: [open],
    onSuccess: (data) => {
      setSelectedRoles(data.roleIds);
    },
  });

  const { run: submit, loading: submitting } = useRequest(
    () => syncUserRoles(user?.id ?? '', { roleIds: selectedRoles }),
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('UserMgmt.toast.roleAssigned', '角色分配成功'));
        onSuccess();
        onOpenChange(false);
      },
    },
  );

  const toggleRole = useCallback((roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setSelectedRoles([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('UserMgmt.dialog.assignRoles', '分配角色')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'UserMgmt.dialog.assignRolesDesc',
              '为用户 {name} 分配角色',
            ).replace('{name}', user?.name ?? '')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t('UserMgmt.label.selectRoles', '选择角色')}</Label>
            {rolesLoading ? (
              <p className="text-sm text-muted-foreground">
                {t('UserMgmt.loading', '加载中...')}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(rolesData?.items ?? []).map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-input"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
                {(rolesData?.items ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('UserMgmt.noRolesAvailable', '该租户下暂无可用角色')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('UserMgmt.btn.cancel', '取消')}
          </Button>
          <Button onClick={() => submit()} disabled={submitting}>
            {submitting
              ? t('UserMgmt.btn.submitting', '提交中...')
              : t('UserMgmt.btn.confirm', '确认')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export type { RoleAssignDialogProps };
export { RoleAssignDialog };
