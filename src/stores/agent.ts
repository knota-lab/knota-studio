import { create } from 'zustand';
import type { FieldConfig } from '@/components/form/types';

// ─── Types ──────────────────────────────────────────────────────

/** Page metadata. */
export interface PageMeta {
  route: string;
  pageKey: string;
  title: string;
  intent: 'create' | 'edit' | 'view' | 'list';
  description?: string;
}

/** Agent-readable column info. */
export interface ColumnInfo {
  key: string;
  label: string;
  filterable?: boolean;
  filterType?: string;
  filterOptions?: ReadonlyArray<{ value: string; label: string }>;
  sortable?: boolean;
  description?: string;
}

/** Table capabilities. */
export interface TableCapabilities {
  tableId: string;
  columns: readonly ColumnInfo[];
  filterFields: FieldConfig[];
  /** Loader the agent can call to query data on demand. */
  loader?: (params: Record<string, unknown>) => Promise<unknown>;
}

/** Form capabilities — field containers only (no actions). */
export interface FormCapabilities {
  formId: string;
  fields: FieldConfig[];
  loader?: (id?: string) => Promise<Record<string, unknown> | undefined>;
}

/**
 * A page-level action that the agent can invoke.
 * Can be form-based (with formId/mode) or a direct operation (with explicit params).
 */
export interface PageAction {
  /** Unique action key (e.g. 'toggleStatus', 'createUser'). */
  actionKey: string;
  /** Human-readable label. */
  label: string;
  /** Description of what this action does. */
  description: string;
  /** Parameters the action accepts (for direct/explicit params). */
  params?: PageActionParam[];
  /** For form-based actions: which form provides the fields. */
  formId?: string;
  /** For form-based actions: create or edit mode. */
  mode?: 'create' | 'edit';
  /**
   * Override fields for this action. When set, `page_get_action_detail`
   * returns these instead of the form's fields — useful when an edit
   * action only needs a subset of the create form (e.g. only `id` + `name`).
   */
  fields?: FieldConfig[];
  /**
   * When true, the executor's return value is sent back to the agent as the
   * action result. Use for data-fetching / query actions.
   */
  query?: boolean;
  /** Execute the action. */
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/** Parameter description for a page action. */
export interface PageActionParam {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: ReadonlyArray<{ value: string; label: string }>;
  description?: string;
}

/** All capabilities for the current active page. */
export interface PageCapabilities {
  meta: PageMeta;
  tables: TableCapabilities[];
  /** Forms are field containers only (no actions). */
  forms: FormCapabilities[];
  /** Unified action list — both form-based and page-level actions. */
  actions: PageAction[];
}

// ─── Store ──────────────────────────────────────────────────────

interface AgentState {
  capabilities: PageCapabilities | null;
  /** All registered pages keyed by route pattern. */
  pages: Map<string, PageCapabilities>;
  /** Route pattern of the most recently registered page. */
  activeRoute: string | null;

  /** Register full page capabilities (meta + tables + forms + actions). */
  registerPage: (caps: PageCapabilities) => void;

  /** Clear all registered pages and reset state. */
  clearAllPages: () => void;

  /** Retrieve capabilities for a specific route. */
  getPage: (route: string) => PageCapabilities | undefined;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  capabilities: null,
  pages: new Map(),
  activeRoute: null,

  registerPage: (caps) =>
    set((state) => {
      const nextPages = new Map(state.pages);
      nextPages.set(caps.meta.route, caps);
      return {
        pages: nextPages,
        activeRoute: caps.meta.route,
        capabilities: caps,
      };
    }),

  clearAllPages: () =>
    set({ pages: new Map(), activeRoute: null, capabilities: null }),

  getPage: (route) => get().pages.get(route),
}));
