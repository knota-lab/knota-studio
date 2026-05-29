import type { PageCapabilities } from '@/stores/agent';

// ─── Types ──────────────────────────────────────────────────────

/** A rig-core compatible tool definition. */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Minimal page context sent alongside tool schemas. */
export interface PageContextMinimal {
  route: string;
  title: string;
  intent: string;
}

// ─── Schema Generator ───────────────────────────────────────────

/**
 * Generate rig-core compatible tool definitions from all registered pages.
 * Aggregates capabilities across pages; only emits tools for capabilities that exist.
 */
export const generatePageToolSchemas = (
  pages: Map<string, PageCapabilities>,
  _activeRoute: string | null,
): ToolDefinition[] => {
  const tools: ToolDefinition[] = [];
  const allPages = [...pages.values()];

  const hasActions = allPages.some((p) => p.actions.length > 0);
  const hasTables = allPages.some((p) => p.tables.length > 0);
  const hasExecutableActions = allPages.some((p) =>
    p.actions.some((a) => a.execute),
  );
  const hasFormLoaders = allPages.some((p) => p.forms.some((f) => f.loader));

  const targetPageParam = {
    type: 'string' as const,
    description:
      '目标页面路由（默认当前页面）。可用值为 system prompt 中列出的已注册页面路由。',
  };

  if (hasActions) {
    tools.push({
      name: 'page_list_actions',
      description:
        '列出目标页面可执行的操作和数据表。返回操作概览列表（每个操作包含 actionKey、标签、描述、参数来源）以及可用数据表列表（每个表包含 tableId、列定义、筛选字段），用于了解页面全部能力。',
      parameters: {
        type: 'object',
        properties: { targetPage: targetPageParam },
        required: [],
      },
    });

    tools.push({
      name: 'page_get_action_detail',
      description:
        '获取目标页面指定操作的详细信息，包括参数定义。若参数来源是表单，返回表单字段列表。',
      parameters: {
        type: 'object',
        properties: {
          targetPage: targetPageParam,
          actionKey: { type: 'string', description: '操作的唯一标识' },
        },
        required: ['actionKey'],
      },
    });
  }

  if (hasTables) {
    tools.push({
      name: 'page_query_table',
      description:
        '查询指定页面的表格数据，支持分页和筛选。多表页面（如通知管理含收件箱+管理）可通过 tableId 指定目标表，不传则查第一张。',
      parameters: {
        type: 'object',
        properties: {
          targetPage: targetPageParam,
          tableId: {
            type: 'string',
            description:
              '目标表格 ID（可选）。多表页面的表格列表可通过 page_list_actions 查看。',
          },
          page: { type: 'number', description: '页码（从1开始）' },
          pageSize: { type: 'number', description: '每页条数' },
          filter: { type: 'object', description: '筛选条件' },
        },
      },
    });
  }

  if (hasExecutableActions) {
    tools.push({
      name: 'page_execute_action',
      description:
        '执行目标页面操作。先调用 page_list_actions 查看可用操作，再调用 page_get_action_detail 了解参数。',
      parameters: {
        type: 'object',
        properties: {
          targetPage: targetPageParam,
          actionKey: { type: 'string', description: '要执行的操作标识' },
          params: { type: 'object', description: '操作参数' },
        },
        required: ['actionKey'],
      },
    });
  }

  if (hasFormLoaders) {
    tools.push({
      name: 'page_get_form_values',
      description: '获取目标页面表单的当前值（用于编辑场景）。',
      parameters: {
        type: 'object',
        properties: {
          targetPage: targetPageParam,
          formId: { type: 'string', description: '表单标识' },
          id: { type: 'string', description: '记录ID（编辑时必传）' },
        },
        required: ['formId'],
      },
    });
  }

  return tools;
};

// ─── Context Generator ──────────────────────────────────────────

/** Extract minimal page context for the AI. */
export const generatePageContext = (
  caps: PageCapabilities,
): PageContextMinimal => ({
  route: caps.meta.route,
  title: caps.meta.title,
  intent: caps.meta.intent,
});

// ─── Global Tools ───────────────────────────────────────────────

/** Generate always-available global tools (not page-dependent). */
export const generateGlobalTools = (): ToolDefinition[] => [
  {
    name: 'list_available_pages',
    description:
      '列出当前用户可访问的所有系统页面。返回页面路径和名称的扁平列表。用于了解系统有哪些页面、帮助用户导航到指定页面。',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'navigate_to_page',
    description:
      '导航到指定页面。调用此工具后前端会执行路由跳转，下一轮对话将自动切换到目标页面的上下文。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '目标页面路由路径（如 /system/users）',
        },
      },
      required: ['path'],
    },
  },
];
