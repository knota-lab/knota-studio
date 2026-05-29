import { useMemo, useRef } from 'react';
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import type {
  WorkerDefinitionResponse,
  WorkerScheduleResponse,
} from './options';
import {
  createScheduleCreateFields,
  createScheduleEditFields,
  createScheduleExecutor,
  updateScheduleExecutor,
} from './options';

interface ScheduleDialogProps {
  open: boolean;
  schedule: WorkerScheduleResponse | null;
  workerDefs: WorkerDefinitionResponse[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ScheduleDialog = ({
  open,
  schedule,
  workerDefs,
  onOpenChange,
  onSuccess,
}: ScheduleDialogProps) => {
  const t = useT();
  const lockedRef = useRef(schedule);
  if (open) {
    lockedRef.current = schedule;
  }
  const editSchedule = lockedRef.current;
  const isEdit = !!editSchedule;

  const workerOptions = useMemo(
    () =>
      workerDefs.map((d) => ({
        value: d.id,
        label: `${d.name} (${d.code})`,
      })),
    [workerDefs],
  );

  const baseFields = isEdit
    ? createScheduleEditFields(t)
    : createScheduleCreateFields(t);

  const fields = baseFields.map((f) =>
    f.name === 'workerDefId' ? { ...f, options: workerOptions } : f,
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isEdit) {
      await updateScheduleExecutor(t)({ id: editSchedule.id, ...values });
    } else {
      await createScheduleExecutor(t)(values);
    }
    onSuccess();
    onOpenChange(false);
  };

  return (
    <ProFormDialog
      key={isEdit ? `edit-${editSchedule?.id}` : 'create-schedule'}
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t('SchedulerMgmt.dialog.editSchedule', '编辑调度计划')
          : t('SchedulerMgmt.dialog.createSchedule', '新建调度计划')
      }
      description={
        isEdit
          ? t(
              'SchedulerMgmt.dialog.editScheduleDesc',
              '修改调度计划「{{name}}」',
              { name: editSchedule?.name ?? '' },
            )
          : t(
              'SchedulerMgmt.dialog.createScheduleDesc',
              '填写信息创建新的调度计划',
            )
      }
      fields={fields}
      editValues={
        isEdit
          ? {
              workerDefId: editSchedule.workerDefId,
              name: editSchedule.name,
              cronExpr: editSchedule.cronExpr,
              paramsJson: editSchedule.paramsJson ?? '',
            }
          : null
      }
      onSubmit={handleSubmit}
    />
  );
};

export type { ScheduleDialogProps };
export { ScheduleDialog };
