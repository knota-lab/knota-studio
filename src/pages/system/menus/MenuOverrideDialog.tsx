import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { MergedMenuTreeResponse } from '@/types/api';
import { createMenuOverrideFormFields, overrideMenuExecutor } from './options';

interface MenuOverrideDialogProps {
  open: boolean;
  menu: MergedMenuTreeResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MenuOverrideDialog = ({
  open,
  menu,
  onOpenChange,
  onSuccess,
}: MenuOverrideDialogProps) => {
  const t = useT();
  const lockedMenuRef = useRef(menu);
  if (open) {
    lockedMenuRef.current = menu;
  }
  const editMenu = lockedMenuRef.current;

  const fields = createMenuOverrideFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!editMenu) return;
    await overrideMenuExecutor(t)({ ...values, sysMenuId: editMenu.id });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={editMenu ? `edit-${editMenu.id}` : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title={t('MenuMgmt.dialog.override', '自定义菜单')}
      description={t(
        'MenuMgmt.dialog.overrideDesc',
        '自定义菜单显示，留空则使用平台默认值',
      )}
      fields={fields}
      editValues={
        editMenu
          ? {
              customName: '',
              customIcon: '',
              customSort: null,
              isHidden: false,
            }
          : null
      }
      onSubmit={handleSubmit}
      columns={1}
    />
  );
};

export type { MenuOverrideDialogProps };
export { MenuOverrideDialog };
