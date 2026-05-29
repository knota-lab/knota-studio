import { useMemo } from 'react';
import { extractFilterFields } from '@/components/pro-table';
import { useT } from '@/i18n';
import { useAgentPage } from '@/lib/agent';
import type { PageCapabilities } from '@/stores/agent';
import { DEFAULT_PAGE_SIZE } from '@/types/common';
import {
  createDictItemCreateFields,
  createDictItemEditFields,
  createDictItemExecutor,
  createDictItemTableColumns,
  createDictTypeCreateFields,
  createDictTypeEditFields,
  createDictTypeExecutor,
  createDictTypeTableColumns,
  createToggleDictItemStatusParams,
  createToggleDictTypeStatusParams,
  DICT_ITEM_FORM_ID,
  DICT_ITEM_TABLE_ID,
  DICT_TYPE_FORM_ID,
  DICT_TYPE_TABLE_ID,
  getDictItemTree,
  listDictTypes,
  toggleDictItemStatusExecutor,
  toggleDictTypeStatusExecutor,
  updateDictItemExecutor,
  updateDictTypeExecutor,
} from './options';

/**
 * Register the Dicts page capabilities with the agent store.
 * This is the single source of truth for what the AI agent can do on this page.
 */
export const useDictsAgent = () => {
  const t = useT();

  useAgentPage(
    useMemo<PageCapabilities>(
      () => ({
        meta: {
          route: '/system/dicts',
          pageKey: 'system_dicts',
          title: t('DictMgmt.title', '字典管理'),
          intent: 'list',
          description: t(
            'DictMgmt.titleDesc',
            '管理字典类型和字典项的增删改查',
          ),
        },
        tables: [
          {
            tableId: DICT_TYPE_TABLE_ID,
            columns: [...createDictTypeTableColumns(t)],
            filterFields: extractFilterFields(createDictTypeTableColumns(t)),
            loader: async (params) => {
              const resp = await listDictTypes({
                page: (params.page as number) ?? 1,
                pageSize: (params.pageSize as number) ?? DEFAULT_PAGE_SIZE,
              });
              return resp;
            },
          },
          {
            tableId: DICT_ITEM_TABLE_ID,
            columns: [...createDictItemTableColumns(t)],
            filterFields: extractFilterFields(createDictItemTableColumns(t)),
            loader: async (params) => {
              const typeCode = params.typeCode as string;
              if (!typeCode) return [];
              const resp = await getDictItemTree(typeCode);
              return resp;
            },
          },
        ],
        forms: [
          {
            formId: DICT_TYPE_FORM_ID,
            fields: createDictTypeCreateFields(t),
          },
          {
            formId: DICT_ITEM_FORM_ID,
            fields: createDictItemCreateFields(t),
          },
        ],
        actions: [
          // Dict Type actions
          {
            actionKey: 'createType',
            label: t('DictMgmt.action.createType', '创建字典类型'),
            description: t(
              'DictMgmt.action.createTypeDesc',
              '创建新的字典类型',
            ),
            formId: DICT_TYPE_FORM_ID,
            mode: 'create',
            fields: createDictTypeCreateFields(t),
            execute: createDictTypeExecutor(t),
          },
          {
            actionKey: 'editType',
            label: t('DictMgmt.action.editType', '编辑字典类型'),
            description: t('DictMgmt.action.editTypeDesc', '编辑字典类型信息'),
            formId: DICT_TYPE_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('DictMgmt.typeId', '类型ID'),
                type: 'text',
                required: true,
                description: t(
                  'DictMgmt.typeIdEditDesc',
                  '要编辑的字典类型ID，从表格数据中获取',
                ),
              },
              {
                name: 'version',
                label: t('DictMgmt.version', '版本号'),
                type: 'number',
                required: true,
                description: t(
                  'DictMgmt.versionDesc',
                  '字典类型当前版本号，用于乐观锁',
                ),
              },
              ...createDictTypeEditFields(t),
            ],
            execute: updateDictTypeExecutor(t),
          },
          {
            actionKey: 'toggleTypeStatus',
            label: t('DictMgmt.action.toggleTypeStatus', '切换字典类型状态'),
            description: t(
              'DictMgmt.action.toggleTypeStatusDesc',
              '启用或禁用指定的字典类型',
            ),
            params: createToggleDictTypeStatusParams(t),
            execute: toggleDictTypeStatusExecutor(t),
          },
          // Dict Item actions
          {
            actionKey: 'createItem',
            label: t('DictMgmt.action.createItem', '创建字典项'),
            description: t(
              'DictMgmt.action.createItemDesc',
              '在指定字典类型下创建新的字典项',
            ),
            formId: DICT_ITEM_FORM_ID,
            mode: 'create',
            fields: [
              {
                name: 'dictTypeId',
                label: t('DictMgmt.dictTypeId', '字典类型ID'),
                type: 'text',
                required: true,
                description: t('DictMgmt.dictTypeIdDesc', '所属字典类型ID'),
              },
              ...createDictItemCreateFields(t),
            ],
            execute: createDictItemExecutor(t),
          },
          {
            actionKey: 'editItem',
            label: t('DictMgmt.action.editItem', '编辑字典项'),
            description: t('DictMgmt.action.editItemDesc', '编辑字典项信息'),
            formId: DICT_ITEM_FORM_ID,
            mode: 'edit',
            fields: [
              {
                name: 'id',
                label: t('DictMgmt.itemId', '字典项ID'),
                type: 'text',
                required: true,
                description: t(
                  'DictMgmt.itemIdEditDesc',
                  '要编辑的字典项ID，从表格数据中获取',
                ),
              },
              {
                name: 'version',
                label: t('DictMgmt.version', '版本号'),
                type: 'number',
                required: true,
                description: t(
                  'DictMgmt.versionDesc',
                  '字典类型当前版本号，用于乐观锁',
                ),
              },
              ...createDictItemEditFields(t),
            ],
            execute: updateDictItemExecutor(t),
          },
          {
            actionKey: 'toggleItemStatus',
            label: t('DictMgmt.action.toggleItemStatus', '切换字典项状态'),
            description: t(
              'DictMgmt.action.toggleItemStatusDesc',
              '启用或禁用指定的字典项',
            ),
            params: createToggleDictItemStatusParams(t),
            execute: toggleDictItemStatusExecutor(t),
          },
        ],
      }),
      [t],
    ),
  );
};
