import {
  createWorkerDefinition,
  createWorkerSchedule,
  deleteWorkerSchedule,
  patchWorkerDefinitionStatus,
  patchWorkerScheduleStatus,
  triggerWorkerSchedule,
  updateWorkerDefinition,
  updateWorkerSchedule,
} from '@/api/task-scheduler';
import type { FieldConfig } from '@/components/form/types';
import type { ColumnOption } from '@/components/pro-table';
import type { TFn } from '@/i18n';
import { validatedFormAction, validatedParamAction } from '@/lib/agent';

// biome-ignore lint/style/useNamingConvention: global constant
export const WORKER_DEF_TABLE_ID = 'system_worker_defs_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const SCHEDULE_TABLE_ID = 'system_worker_schedules_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const EXECUTION_TABLE_ID = 'system_worker_executions_list';
// biome-ignore lint/style/useNamingConvention: global constant
export const WORKER_DEF_FORM_ID = 'worker_def_create_edit';
// biome-ignore lint/style/useNamingConvention: global constant
export const SCHEDULE_FORM_ID = 'worker_schedule_create_edit';

// ─── Worker Definition Table Columns ────────────────────────

export function createWorkerDefTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'code',
      label: t('SchedulerMgmt.column.code', '任务编码'),
      size: 200,
      filterable: false,
      description: t('SchedulerMgmt.column.codeDesc', 'Worker 唯一编码'),
    },
    {
      key: 'name',
      label: t('SchedulerMgmt.column.name', '任务名称'),
      size: 180,
      filterable: true,
      search: {
        type: 'text',
        placeholder: t('SchedulerMgmt.column.namePlaceholder', '搜索任务名称'),
      },
      description: t('SchedulerMgmt.column.nameDesc', 'Worker 显示名称'),
    },
    {
      key: 'category',
      label: t('SchedulerMgmt.column.category', '分类'),
      size: 120,
      align: 'center',
      filterable: false,
      description: t('SchedulerMgmt.column.categoryDesc', 'Worker 分类'),
    },
    {
      key: 'status',
      label: t('SchedulerMgmt.column.status', '状态'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.statusDesc',
        '启用/停用状态（点击切换）',
      ),
    },
    {
      key: 'allowConcurrent',
      label: t('SchedulerMgmt.column.allowConcurrent', '允许并发'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.allowConcurrentDesc',
        '是否允许并发执行',
      ),
    },
    {
      key: 'timeoutSecs',
      label: t('SchedulerMgmt.column.timeoutSecs', '超时(秒)'),
      size: 90,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.timeoutSecsDesc',
        '执行超时时间（秒）',
      ),
    },
    {
      key: 'actions',
      label: t('SchedulerMgmt.column.actions', '操作'),
      size: 180,
      enableResizing: false,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.actionsDesc',
        '编辑、授权租户等操作',
      ),
    },
  ];
}

// ─── Schedule Table Columns ─────────────────────────────────

export function createScheduleTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'workerName',
      label: t('SchedulerMgmt.column.workerName', '任务名称'),
      size: 180,
      filterable: false,
      description: t(
        'SchedulerMgmt.column.workerNameDesc',
        '关联的 Worker 名称',
      ),
    },
    {
      key: 'name',
      label: t('SchedulerMgmt.column.scheduleName', '计划名称'),
      size: 180,
      filterable: false,
      description: t('SchedulerMgmt.column.scheduleNameDesc', '调度计划名称'),
    },
    {
      key: 'cronExpr',
      label: t('SchedulerMgmt.column.cronExpr', 'Cron 表达式'),
      size: 160,
      filterable: false,
      description: t('SchedulerMgmt.column.cronExprDesc', 'Cron 调度表达式'),
    },
    {
      key: 'paramsJson',
      label: t('SchedulerMgmt.column.paramsJson', '参数'),
      size: 160,
      filterable: false,
      ellipsis: true,
      description: t('SchedulerMgmt.column.paramsJsonDesc', '执行参数 JSON'),
    },
    {
      key: 'enabled',
      label: t('SchedulerMgmt.column.enabled', '启用'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.enabledDesc',
        '是否启用（点击切换）',
      ),
    },
    {
      key: 'lastRunAt',
      label: t('SchedulerMgmt.column.lastRunAt', '最近执行'),
      size: 160,
      filterable: false,
      description: t('SchedulerMgmt.column.lastRunAtDesc', '上次执行时间'),
    },
    {
      key: 'nextRunAt',
      label: t('SchedulerMgmt.column.nextRunAt', '下次执行'),
      size: 160,
      filterable: false,
      description: t('SchedulerMgmt.column.nextRunAtDesc', '下次预计执行时间'),
    },
    {
      key: 'actions',
      label: t('SchedulerMgmt.column.actions', '操作'),
      size: 220,
      enableResizing: false,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.scheduleActionsDesc',
        '编辑、立即执行、删除',
      ),
    },
  ];
}

// ─── Execution Table Columns ────────────────────────────────

export function createExecutionTableColumns(t: TFn): ColumnOption[] {
  return [
    {
      key: 'workerName',
      label: t('SchedulerMgmt.column.workerName', '任务名称'),
      size: 180,
      filterable: false,
      description: t(
        'SchedulerMgmt.column.execWorkerNameDesc',
        '执行的 Worker 名称',
      ),
    },
    {
      key: 'scheduleName',
      label: t('SchedulerMgmt.column.scheduleName', '计划名称'),
      size: 160,
      filterable: false,
      description: t(
        'SchedulerMgmt.column.execScheduleNameDesc',
        '关联的调度计划',
      ),
    },
    {
      key: 'triggerType',
      label: t('SchedulerMgmt.column.triggerType', '触发方式'),
      size: 110,
      align: 'center',
      filterable: false,
      description: t(
        'SchedulerMgmt.column.triggerTypeDesc',
        'manual / scheduled',
      ),
    },
    {
      key: 'status',
      label: t('SchedulerMgmt.column.status', '状态'),
      size: 100,
      align: 'center',
      filterable: false,
      description: t('SchedulerMgmt.column.execStatusDesc', '执行状态'),
    },
    {
      key: 'retryCount',
      label: t('SchedulerMgmt.column.retryCount', '重试'),
      size: 70,
      align: 'center',
      filterable: false,
      description: t('SchedulerMgmt.column.retryCountDesc', '重试次数'),
    },
    {
      key: 'startedAt',
      label: t('SchedulerMgmt.column.startedAt', '开始时间'),
      size: 160,
      filterable: false,
      description: t('SchedulerMgmt.column.startedAtDesc', '执行开始时间'),
    },
    {
      key: 'durationMs',
      label: t('SchedulerMgmt.column.durationMs', '耗时'),
      size: 90,
      align: 'center',
      filterable: false,
      description: t('SchedulerMgmt.column.durationMsDesc', '执行耗时（ms）'),
    },
    {
      key: 'actions',
      label: t('SchedulerMgmt.column.actions', '操作'),
      size: 100,
      enableResizing: false,
      align: 'center',
      filterable: false,
      description: t('SchedulerMgmt.column.execActionsDesc', '查看详情'),
    },
  ];
}

// ─── Worker Definition Form Fields ──────────────────────────

export function createWorkerDefCreateFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'code',
      label: t('SchedulerMgmt.field.code', '任务编码'),
      type: 'text',
      required: true,
      description: t(
        'SchedulerMgmt.field.codeDesc',
        'Worker 唯一编码，创建后不可修改',
      ),
    },
    {
      name: 'name',
      label: t('SchedulerMgmt.field.name', '任务名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      label: t('SchedulerMgmt.field.category', '分类'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('SchedulerMgmt.field.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
    {
      name: 'paramsSchema',
      label: t('SchedulerMgmt.field.paramsSchema', '参数结构'),
      type: 'textarea',
      colSpan: 2,
      description: t(
        'SchedulerMgmt.field.paramsSchemaDesc',
        'JSON Schema 格式的参数定义',
      ),
    },
    {
      name: 'timeoutSecs',
      label: t('SchedulerMgmt.field.timeoutSecs', '超时秒数'),
      type: 'number',
      defaultValue: 60,
      required: true,
    },
    {
      name: 'maxRetries',
      label: t('SchedulerMgmt.field.maxRetries', '最大重试次数'),
      type: 'number',
      defaultValue: 0,
      required: true,
    },
    {
      name: 'allowConcurrent',
      label: t('SchedulerMgmt.field.allowConcurrent', '允许并发执行'),
      type: 'boolean',
      defaultValue: false,
    },
  ];
}

export function createWorkerDefEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('SchedulerMgmt.field.name', '任务名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      label: t('SchedulerMgmt.field.category', '分类'),
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: t('SchedulerMgmt.field.description', '描述'),
      type: 'textarea',
      colSpan: 2,
    },
    {
      name: 'paramsSchema',
      label: t('SchedulerMgmt.field.paramsSchema', '参数结构'),
      type: 'textarea',
      colSpan: 2,
    },
    {
      name: 'timeoutSecs',
      label: t('SchedulerMgmt.field.timeoutSecs', '超时秒数'),
      type: 'number',
      required: true,
    },
    {
      name: 'maxRetries',
      label: t('SchedulerMgmt.field.maxRetries', '最大重试次数'),
      type: 'number',
      required: true,
    },
    {
      name: 'allowConcurrent',
      label: t('SchedulerMgmt.field.allowConcurrent', '允许并发执行'),
      type: 'boolean',
    },
  ];
}

// ─── Schedule Form Fields ───────────────────────────────────

export function createScheduleCreateFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'workerDefId',
      label: t('SchedulerMgmt.field.workerDefId', '任务定义'),
      type: 'select',
      required: true,
      options: [],
      description: t(
        'SchedulerMgmt.field.workerDefIdDesc',
        '选择关联的 Worker 定义，创建后不可修改',
      ),
    },
    {
      name: 'name',
      label: t('SchedulerMgmt.field.scheduleName', '计划名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'cronExpr',
      label: t('SchedulerMgmt.field.cronExpr', 'Cron 表达式'),
      type: 'text',
      required: true,
      description: t(
        'SchedulerMgmt.field.cronExprHint',
        '标准 cron 格式，例如 0 */5 * * * * 表示每 5 分钟',
      ),
    },
    {
      name: 'paramsJson',
      label: t('SchedulerMgmt.field.paramsJson', '执行参数 JSON'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

export function createScheduleEditFields(t: TFn): FieldConfig[] {
  return [
    {
      name: 'name',
      label: t('SchedulerMgmt.field.scheduleName', '计划名称'),
      type: 'text',
      required: true,
    },
    {
      name: 'cronExpr',
      label: t('SchedulerMgmt.field.cronExpr', 'Cron 表达式'),
      type: 'text',
      required: true,
      description: t(
        'SchedulerMgmt.field.cronExprHint',
        '标准 cron 格式，例如 0 */5 * * * * 表示每 5 分钟',
      ),
    },
    {
      name: 'paramsJson',
      label: t('SchedulerMgmt.field.paramsJson', '执行参数 JSON'),
      type: 'textarea',
      colSpan: 2,
    },
  ];
}

// ─── API Re-exports ────────────────────────────────────────────
export type {
  WorkerDefinitionResponse,
  WorkerExecutionResponse,
  WorkerScheduleResponse,
} from '@/api/task-scheduler';
export {
  batchSetWorkerGrants,
  getWorkerExecution,
  getWorkerGrantTenants,
  listWorkerDefinitions,
  listWorkerExecutions,
  listWorkerSchedules,
} from '@/api/task-scheduler';
export { getAllTenants } from '@/api/tenants';
export {
  createWorkerDefinition,
  createWorkerSchedule,
  deleteWorkerSchedule,
  patchWorkerDefinitionStatus,
  patchWorkerScheduleStatus,
  triggerWorkerSchedule,
  updateWorkerDefinition,
  updateWorkerSchedule,
};

// ─── Validated Executors ──────────────────────────────────────
export function createWorkerDefExecutor(t: TFn) {
  return validatedFormAction(
    createWorkerDefCreateFields(t),
    t,
    async (v) =>
      createWorkerDefinition({
        code: v.code as string,
        name: v.name as string,
        category: (v.category ?? '') as string,
        description: v.description as string | undefined,
        paramsSchema: v.paramsSchema as string | undefined,
        timeoutSecs: v.timeoutSecs as number | undefined,
        maxRetries: v.maxRetries as number | undefined,
        allowConcurrent: v.allowConcurrent as boolean,
      }),
    t('SchedulerMgmt.toast.defCreated', 'Worker 创建成功'),
  );
}

export function updateWorkerDefExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'code',
        label: t('SchedulerMgmt.field.code', '任务编码'),
        type: 'text',
        required: true,
      },
      {
        name: 'name',
        label: t('SchedulerMgmt.field.name', '任务名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'category',
        label: t('SchedulerMgmt.field.category', '分类'),
        type: 'text',
      },
      {
        name: 'description',
        label: t('SchedulerMgmt.field.description', '描述'),
        type: 'textarea',
      },
      {
        name: 'paramsSchema',
        label: t('SchedulerMgmt.field.paramsSchema', '参数结构'),
        type: 'textarea',
      },
      {
        name: 'timeoutSecs',
        label: t('SchedulerMgmt.field.timeoutSecs', '超时秒数'),
        type: 'number',
      },
      {
        name: 'maxRetries',
        label: t('SchedulerMgmt.field.maxRetries', '最大重试次数'),
        type: 'number',
      },
      {
        name: 'allowConcurrent',
        label: t('SchedulerMgmt.field.allowConcurrent', '允许并发执行'),
        type: 'boolean',
      },
    ],
    t,
    async (v) =>
      updateWorkerDefinition(v.code as string, {
        name: v.name as string,
        category: (v.category ?? '') as string,
        description: v.description as string | undefined,
        paramsSchema: v.paramsSchema as string | undefined,
        timeoutSecs: v.timeoutSecs as number | undefined,
        maxRetries: v.maxRetries as number | undefined,
        allowConcurrent: v.allowConcurrent as boolean,
      }),
    t('SchedulerMgmt.toast.defUpdated', 'Worker 更新成功'),
  );
}

export function toggleDefStatusExecutor(t: TFn) {
  return validatedParamAction(
    [
      {
        name: 'code',
        label: t('SchedulerMgmt.field.code', '任务编码'),
        type: 'string',
        required: true,
      },
      {
        name: 'status',
        label: t('SchedulerMgmt.field.status', '状态'),
        type: 'string',
        required: true,
      },
    ],
    t,
    async (v) =>
      patchWorkerDefinitionStatus(v.code as string, v.status as string),
    t('SchedulerMgmt.toast.statusUpdated', '状态更新成功'),
  );
}

export function createScheduleExecutor(t: TFn) {
  return validatedFormAction(
    createScheduleCreateFields(t),
    t,
    async (v) =>
      createWorkerSchedule({
        workerDefId: v.workerDefId as string,
        name: v.name as string,
        cronExpr: v.cronExpr as string,
        paramsJson: v.paramsJson as string | undefined,
      }),
    t('SchedulerMgmt.toast.scheduleCreated', '计划创建成功'),
  );
}

export function updateScheduleExecutor(t: TFn) {
  return validatedFormAction(
    [
      {
        name: 'id',
        label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
        type: 'text',
        required: true,
      },
      {
        name: 'name',
        label: t('SchedulerMgmt.field.scheduleName', '计划名称'),
        type: 'text',
        required: true,
      },
      {
        name: 'cronExpr',
        label: t('SchedulerMgmt.field.cronExpr', 'Cron 表达式'),
        type: 'text',
        required: true,
      },
      {
        name: 'paramsJson',
        label: t('SchedulerMgmt.field.paramsJson', '执行参数 JSON'),
        type: 'textarea',
      },
    ],
    t,
    async (v) =>
      updateWorkerSchedule(v.id as string, {
        name: v.name as string,
        cronExpr: v.cronExpr as string,
        paramsJson: v.paramsJson as string | undefined,
      }),
    t('SchedulerMgmt.toast.scheduleUpdated', '计划更新成功'),
  );
}

export function toggleScheduleStatusExecutor(t: TFn) {
  return validatedParamAction(
    [
      {
        name: 'id',
        label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
        type: 'string',
        required: true,
      },
      {
        name: 'enabled',
        label: t('SchedulerMgmt.field.enabled', '启用'),
        type: 'string',
        required: true,
      },
    ],
    t,
    async (v) =>
      patchWorkerScheduleStatus(
        v.id as string,
        (v.enabled as string) === 'true',
      ),
    t('SchedulerMgmt.toast.scheduleStatusUpdated', '计划状态更新成功'),
  );
}

export function deleteScheduleExecutor(t: TFn) {
  return validatedParamAction(
    [
      {
        name: 'id',
        label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
        type: 'string',
        required: true,
      },
    ],
    t,
    async (v) => deleteWorkerSchedule(v.id as string),
    t('SchedulerMgmt.toast.scheduleDeleted', '计划删除成功'),
  );
}

export function triggerScheduleExecutor(t: TFn) {
  return validatedParamAction(
    [
      {
        name: 'id',
        label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
        type: 'string',
        required: true,
      },
    ],
    t,
    async (v) => {
      await triggerWorkerSchedule(v.id as string);
    },
    t('SchedulerMgmt.toast.triggered', '触发成功'),
  );
}
