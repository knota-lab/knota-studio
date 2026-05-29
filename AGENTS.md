# knota-studio — AGENTS.md

knota-studio is the management frontend for the **knota-fold** platform — a multi-tenant,
RBAC-gated enterprise application base. It talks to the knota-fold Rust backend via
a `/api` REST + SSE interface.

## Stack

- **Runtime**: React 19, TypeScript 6, Tailwind CSS 4
- **Build**: Rsbuild 2, pnpm 10, Biome 2 (format + lint)
- **Tables/Forms**: TanStack Table 8, TanStack Form 1, Zod 4
- **Charts/UI**: shadcn/ui (Radix primitives), Iconify (Lucide icons)
- **State**: React Context (auth), Zustand (agent page capabilities)
- **Hooks**: ahooks (useRequest), react-router-dom v7
- **i18n**: Custom runtime — lazy-loaded bundles, ETag 304, localStorage cache
- **Tests**: Vitest 4

## Commands

```bash
pnpm dev              # Dev server at http://localhost:3000 (proxies /api to :5150)
pnpm build            # Production build → dist/
pnpm preview          # Preview production build
pnpm check            # Biome lint + TypeScript check (pre-commit hook runs this)
pnpm lint:fix         # Biome auto-fix + tsc verify
pnpm test             # Run all unit tests (vitest run)
pnpm test:watch       # Watch mode
pnpm i18n:extract     # Extract t() keys → upload manifest to backend CI endpoint
pnpm i18n:fix-conflicts  # Resolve source-text conflicts in i18n manifest
```

## Directory Layout

```
src/
├── api/              # Per-domain API modules + shared client + errorMap
│   ├── client.ts     #   fetch wrapper (GET/POST/PUT/PATCH/DELETE/SSE/Blob)
│   └── errorMap.ts   #   backend error code → i18n key mapping
├── components/       # Shared UI components
│   ├── ui/           #   shadcn/ui primitives (button, dialog, select, …)
│   ├── data-table/   #   TanStack Table wrapper (resize, pagination)
│   ├── pro-table/    #   Full CRUD table (search, pagination, column config)
│   ├── form/         #   Declarative form system (TanStack Form + Zod)
│   ├── AuthGuard     #   Route guard (checks JWT, redirects to /login)
│   ├── ErrorBoundary #   Render-error catcher with retry button
│   └── PageLoader    #   Centered spinner for Suspense fallback
├── i18n/             # Runtime i18n engine
│   ├── provider.tsx  #   I18nProvider (useSyncExternalStore)
│   ├── translate.ts  #   Pure key resolution + {{var}} interpolation
│   ├── cache.ts      #   Memory + localStorage two-level cache
│   └── api.ts        #   Bundle fetcher (If-None-Match / 304)
├── layout/           # MainLayout (collapsible sidebar, breadcrumbs, theme/lang)
├── lib/              # Utilities
│   └── agent/        #   AI Agent page-capability registration + tool bridge
├── pages/            # Page components (one folder per route)
│   ├── login/        #   Login page (captcha, lockout countdown)
│   ├── dashboard/    #   Dashboard (user profile, tenant info, quick nav)
│   └── system/       #   Admin module pages (users, roles, tenants, …)
├── stores/           # State management
│   ├── auth.tsx      #   AuthProvider (login/logout/refreshUser/loading)
│   └── agent.ts      #   Zustand store for agent page capabilities
├── types/            # Shared TypeScript interfaces (UserResponse, TenantResponse, …)
└── utils/            # formatBytes, smart-date-parse, toast wrapper, uploader
```

## Key Conventions

### Architecture constraint (enforced by Biome `noRestrictedImports`)

```
pages → must NOT import from @/api directly
pages → must NOT import from sonner directly
pages → use local options.ts for CRUD configuration
pages → use @/utils/toast for notifications
```

Every system page (`pages/system/<module>/`) follows the same file structure:

```
system/<module>/
├── index.tsx        # Main page (ProTable + search + CRUD dialogs)
├── options.ts       # Column definitions, search fields, API bindings
└── agent.ts         # Page capability registration for AI agent
```

### i18n Usage

```tsx
const t = useT();
<span>{t('Namespace.key', 'fallback text')}</span>
```

- Keys are dot-separated: `Module.section.detail`
- Fallback is shown when no translation bundle is loaded
- The CI script `i18n:extract` scans all `t()` calls and uploads keys to the backend

### API Client

```ts
import { get, post, put, del } from '@/api/client';

// Auto-attaches Authorization header, auto-toasts errors
const data = await get<UserResponse>('/users/me');

// Suppress auto-toast for manual error handling
const result = await post('/roles', payload, { throwError: true });
```

Standard response type: `PaginatedResponse<T> = { items: T[]; totalItems: number; page: number; pageSize: number }`

### Adding a New System Module Page

1. Create `src/pages/system/<module>/index.tsx`, `options.ts`, `agent.ts`
2. Add the API module in `src/api/<module>.ts`
3. Add route in `src/routes.tsx` using `lazyRoute(() => import(...))`
4. The `lazyRoute()` helper auto-wraps with ErrorBoundary + Suspense fallback

### Agent System

Pages register capabilities via `useAgentPage(capabilities)` in their `agent.ts`.
The `KbChat` component reads registered capabilities and generates tool definitions
for the AI. Tools can be global (navigation) or page-specific (CRUD operations from options.ts).
