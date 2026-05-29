import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { RoleTemplateResponse } from '@/types/role-template';
import {
  createRoleTemplateCreateFields,
  createRoleTemplateEditFields,
  createRoleTemplateExecutor,
  updateRoleTemplateExecutor,
} from './options';

interface RoleTemplateDialogProps {
  open: boolean;
  template: RoleTemplateResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RoleTemplateDialog = ({
  open,
  template,
  onOpenChange,
  onSuccess,
}: RoleTemplateDialogProps) => {
  const t = useT();

  const lockedTemplateRef = useRef(template);
  if (open) {
    lockedTemplateRef.current = template;
  }
  const editTemplate = lockedTemplateRef.current;
  const isEdit = !!editTemplate;

  const fields = isEdit
    ? createRoleTemplateEditFields(t)
    : createRoleTemplateCreateFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateRoleTemplateExecutor(t)({ id: editTemplate.id, ...values });
    } else {
      await createRoleTemplateExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editTemplate?.id}` : 'create'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('RoleTemplateMgmt.dialog.edit', '编辑角色模板')
          : t('RoleTemplateMgmt.dialog.create', '创建角色模板')
      }
      description={
        isEdit
          ? t('RoleTemplateMgmt.dialog.editDesc', '编辑角色模板信息')
          : t('RoleTemplateMgmt.dialog.createDesc', '创建新的角色模板')
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              name: editTemplate.name,
              description: editTemplate.description ?? '',
              isDefault: editTemplate.isDefault,
              sortOrder: editTemplate.sortOrder,
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { RoleTemplateDialogProps };
export { RoleTemplateDialog };
