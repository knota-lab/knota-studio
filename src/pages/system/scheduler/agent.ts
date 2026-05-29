import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  createExecutionTableColumns,
  createScheduleCreateFields,
  createScheduleEditFields,
  createScheduleExecutor,
  createScheduleTableColumns,
  createWorkerDefCreateFields,
  createWorkerDefEditFields,
  createWorkerDefExecutor,
  createWorkerDefTableColumns,
  deleteScheduleExecutor,
  EXECUTION_TABLE_ID,
  listWorkerDefinitions,
  listWorkerExecutions,
  listWorkerSchedules,
  SCHEDULE_FORM_ID,
  SCHEDULE_TABLE_ID,
  toggleDefStatusExecutor,
  toggleScheduleStatusExecutor,
  triggerScheduleExecutor,
  updateScheduleExecutor,
  updateWorkerDefExecutor,
  WORKER_DEF_FORM_ID,
  WORKER_DEF_TABLE_ID,
} from './options';

export const useSchedulerAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/scheduler',
          pageKey: 'system_scheduler',
          title: t('SchedulerMgmt.title', '任务调度'),
          intent: 'list',
          description: t(
            'SchedulerMgmt.titleDesc',
            '管理 Worker 定义、调度计划和执行记录',
          ),
        },
        tables: [
          {
            tableId: WORKER_DEF_TABLE_ID,
            columns: [...createWorkerDefTableColumns(t)],
            filterFields: extractFilterFields(createWorkerDefTableColumns(t)),
            loader: async () => {
              return listWorkerDefinitions();
            },
          },
          {
            tableId: SCHEDULE_TABLE_ID,
            columns: [...createScheduleTableColumns(t)],
            filterFields: extractFilterFields(createScheduleTableColumns(t)),
            loader: async () => {
              return listWorkerSchedules();
            },
          },
          {
            tableId: EXECUTION_TABLE_ID,
            columns: [...createExecutionTableColumns(t)],
            filterFields: extractFilterFields(createExecutionTableColumns(t)),
            loader: async (params) => {
              return listWorkerExecutions({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
            },
          },
        ],
        forms: [
          {
            formId: WORKER_DEF_FORM_ID,
            fields: createWorkerDefCreateFields(t),
          },
          {
            formId: SCHEDULE_FORM_ID,
            fields: createScheduleCreateFields(t),
          },
        ],
        actions: [
          // ─── Worker Definition actions ─────────────────────
          {
            actionKey: 'createWorkerDef',
            label: t('SchedulerMgmt.action.createWorkerDef', '新建任务定义'),
            description: t(
              'SchedulerMgmt.action.createWorkerDefDesc',
              '创建新的 Worker 定义',
            ),
            formId: WORKER_DEF_FORM_ID,
            mode: 'create',
            fields: createWorkerDefCreateFields(t),
            execute: createWorkerDefExecutor(t),
          },
          {
            actionKey: 'editWorkerDef',
            label: t('SchedulerMgmt.action.editWorkerDef', '编辑任务定义'),
            description: t(
              'SchedulerMgmt.action.editWorkerDefDesc',
              '编辑 Worker 定义信息',
            ),
            formId: WORKER_DEF_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'code',
                label: t('SchedulerMgmt.field.code', '任务编码'),
                type: 'text',
                required: true,
                description: t(
                  'SchedulerMgmt.field.codeEditDesc',
                  '要编辑的 Worker 编码',
                ),
              },
              ...createWorkerDefEditFields(t),
            ],
            execute: updateWorkerDefExecutor(t),
          },
          {
            actionKey: 'toggleDefStatus',
            label: t(
              'SchedulerMgmt.action.toggleDefStatus',
              '切换任务定义状态',
            ),
            description: t(
              'SchedulerMgmt.action.toggleDefStatusDesc',
              '启用或停用 Worker 定义',
            ),
            params: [
              {
                name: 'code',
                label: t('SchedulerMgmt.field.code', '任务编码'),
                type: 'string',
                required: true,
                description: t(
                  'SchedulerMgmt.field.codeToggleDesc',
                  '要切换状态的 Worker 编码',
                ),
              },
              {
                name: 'status',
                label: t('SchedulerMgmt.column.status', '状态'),
                type: 'select',
                required: true,
                options: [
                  { value: 'active', label: 'active' },
                  { value: 'disabled', label: 'disabled' },
                ],
                description: t(
                  'SchedulerMgmt.field.statusToggleDesc',
                  '目标状态',
                ),
              },
            ],
            execute: toggleDefStatusExecutor(t),
          },
          // ─── Schedule actions ──────────────────────────────
          {
            actionKey: 'createSchedule',
            label: t('SchedulerMgmt.action.createSchedule', '新建调度计划'),
            description: t(
              'SchedulerMgmt.action.createScheduleDesc',
              '创建新的调度计划',
            ),
            formId: SCHEDULE_FORM_ID,
            mode: 'create',
            fields: createScheduleCreateFields(t),
            execute: createScheduleExecutor(t),
          },
          {
            actionKey: 'editSchedule',
            label: t('SchedulerMgmt.action.editSchedule', '编辑调度计划'),
            description: t(
              'SchedulerMgmt.action.editScheduleDesc',
              '编辑调度计划信息',
            ),
            formId: SCHEDULE_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
                type: 'text',
                required: true,
                description: t(
                  'SchedulerMgmt.field.scheduleIdEditDesc',
                  '要编辑的调度计划 ID',
                ),
              },
              ...createScheduleEditFields(t),
            ],
            execute: updateScheduleExecutor(t),
          },
          {
            actionKey: 'toggleScheduleStatus',
            label: t(
              'SchedulerMgmt.action.toggleScheduleStatus',
              '切换调度计划状态',
            ),
            description: t(
              'SchedulerMgmt.action.toggleScheduleStatusDesc',
              '启用或停用调度计划',
            ),
            params: [
              {
                name: 'id',
                label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
                type: 'string',
                required: true,
                description: t(
                  'SchedulerMgmt.field.scheduleIdToggleDesc',
                  '要切换状态的调度计划 ID',
                ),
              },
              {
                name: 'enabled',
                label: t('SchedulerMgmt.column.enabled', '启用'),
                type: 'boolean',
                required: true,
                description: t(
                  'SchedulerMgmt.field.enabledToggleDesc',
                  '是否启用',
                ),
              },
            ],
            execute: toggleScheduleStatusExecutor(t),
          },
          {
            actionKey: 'deleteSchedule',
            label: t('SchedulerMgmt.action.deleteSchedule', '删除调度计划'),
            description: t(
              'SchedulerMgmt.action.deleteScheduleDesc',
              '删除指定的调度计划',
            ),
            params: [
              {
                name: 'id',
                label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
                type: 'string',
                required: true,
                description: t(
                  'SchedulerMgmt.field.scheduleIdDeleteDesc',
                  '要删除的调度计划 ID',
                ),
              },
            ],
            execute: deleteScheduleExecutor(t),
          },
          {
            actionKey: 'triggerSchedule',
            label: t('SchedulerMgmt.action.triggerSchedule', '立即执行'),
            description: t(
              'SchedulerMgmt.action.triggerScheduleDesc',
              '手动触发调度计划执行',
            ),
            params: [
              {
                name: 'id',
                label: t('SchedulerMgmt.field.scheduleId', '计划ID'),
                type: 'string',
                required: true,
                description: t(
                  'SchedulerMgmt.field.scheduleIdTriggerDesc',
                  '要触发的调度计划 ID',
                ),
              },
            ],
            execute: triggerScheduleExecutor(t),
          },
        ],
      }),
      [t],
    ),
  );
};
