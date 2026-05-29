import { useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type { WorkerDefinitionResponse } from './options';
import {
  createWorkerDefCreateFields,
  createWorkerDefEditFields,
  createWorkerDefExecutor,
  updateWorkerDefExecutor,
} from './options';

interface WorkerDefDialogProps {
  open: boolean;
  workerDef: WorkerDefinitionResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const WorkerDefDialog = ({
  open,
  workerDef,
  onOpenChange,
  onSuccess,
}: WorkerDefDialogProps) => {
  const t = useT();
  const lockedRef = useRef(workerDef);
  if (open) {
    lockedRef.current = workerDef;
  }
  const editDef = lockedRef.current;
  const isEdit = !!editDef;

  const fields = isEdit
    ? createWorkerDefEditFields(t)
    : createWorkerDefCreateFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateWorkerDefExecutor(t)({ code: editDef.code, ...values });
    } else {
      await createWorkerDefExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editDef?.id}` : 'create-def'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('SchedulerMgmt.dialog.editDef', '编辑任务定义')
          : t('SchedulerMgmt.dialog.createDef', '新建任务定义')
      }
      description={
        isEdit
          ? t(
              'SchedulerMgmt.dialog.editDefDesc',
              '修改 Worker 定义「{{name}}」',
              { name: editDef?.name ?? '' },
            )
          : t(
              'SchedulerMgmt.dialog.createDefDesc',
              '填写信息创建新的 Worker 定义',
            )
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              name: editDef.name,
              category: editDef.category,
              description: editDef.description ?? '',
              paramsSchema: editDef.paramsSchema ?? '',
              timeoutSecs: editDef.timeoutSecs,
              maxRetries: editDef.maxRetries,
              allowConcurrent: editDef.allowConcurrent,
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { WorkerDefDialogProps };
export { WorkerDefDialog };
