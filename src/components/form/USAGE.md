# ProForm / ProFormDialog 使用文档

基于 `@tanstack/react-form` + `zod` 的声明式表单方案。零样板代码——定义字段配置，自动生成 Zod schema、默认值、校验和 UI。

---

## 快速开始

### 1. 在 `options.ts` 中定义字段

```ts
// src/pages/system/my-module/options.ts
import type { FieldConfig } from '@/components/form/types';
import type { TFn } from '@/i18n';

export function createUserFormFields(t: TFn): FieldConfig[] {
  return [
    { name: 'username', label: t('UserMgmt.username', '用户名'), type: 'text', required: true },
    { name: 'email', label: t('UserMgmt.email', '邮箱'), type: 'text', required: true,
      rule: z.string().email(t('UserMgmt.emailInvalid', '邮箱格式不正确')) },
    { name: 'password', label: t('UserMgmt.password', '密码'), type: 'password', required: true,
      rule: z.string().min(6, t('UserMgmt.passwordMin', '密码至少6位')) },
    { name: 'roleId', label: t('UserMgmt.role', '角色'), type: 'select', required: true },
    { name: 'description', label: t('UserMgmt.description', '描述'), type: 'textarea', colSpan: 2 },
  ];
}
```

### 2. 在 Dialog 组件中使用

```tsx
// src/pages/system/my-module/UserDialog.tsx
import { ProFormDialog } from '@/components/form/pro-form-dialog';
import { useT } from '@/i18n';
import { createUserFormFields } from './options';

const UserDialog = ({ open, onOpenChange, onSuccess }) => {
  const t = useT();
  const fields = createUserFormFields(t);

  const handleSubmit = async (values: Record<string, unknown>) => {
    await createUser(values);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <ProFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('UserMgmt.dialog.create', '新建用户')}
      description={t('UserMgmt.dialog.createDesc', '填写信息创建新用户')}
      fields={fields}
      onSubmit={handleSubmit}
    />
  );
};
```

---

## ProFormDialog Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 控制 Dialog 开关 |
| `onOpenChange` | `(open: boolean) => void` | — | Dialog 开关回调 |
| `title` | `string` | — | Dialog 标题 |
| `description` | `string?` | — | Dialog 描述文字 |
| `fields` | `FieldConfig[]` | — | 字段配置（核心） |
| `schema` | `z.ZodTypeAny?` | 自动生成 | 覆盖自动生成的 Zod schema |
| `editValues` | `Record<string, unknown> \| null` | — | 编辑模式的初始值 |
| `onSubmit` | `(values: Record<string, unknown>) => Promise<void> \| void` | — | 表单提交回调 |
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | 表单布局列数 |
| `maxWidth` | `string` | `'sm:max-w-[600px]'` | Dialog 最大宽度（Tailwind class） |
| `footer` | `ReactNode?` | 取消+确认按钮 | 自定义底部按钮区 |

---

## FieldConfig 字段类型

### 基础属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 字段名，对应 form values 的 key |
| `label` | `string` | 字段标签 |
| `type` | `FieldType` | 字段类型（见下表） |
| `required` | `boolean?` | 是否必填。`true` 时自动生成 `z.string().min(1)` |
| `placeholder` | `string?` | 占位文字 |
| `description` | `string?` | 字段描述 |
| `defaultValue` | `unknown?` | 默认值，覆盖内置默认值 |
| `colSpan` | `1 \| 2 \| 3 \| 4?` | 跨列数，默认 1 |
| `rule` | `z.ZodTypeAny?` | 自定义 Zod 校验规则，覆盖自动生成 |

### 条件显隐

| 属性 | 类型 | 说明 |
|------|------|------|
| `showWhen` | `{ field: string; value: unknown }?` | 当某字段等于指定值时显示 |
| `disabledWhen` | `{ field: string; value: unknown }?` | 当某字段等于指定值时禁用 |

### 选择类型专用

| 属性 | 类型 | 说明 |
|------|------|------|
| `options` | `SelectOption[]?` | select / multiselect 的选项列表 |
| `remote` | `RemoteOptionSource?` | remote-select 的远程数据源 |

### 自定义渲染

| 属性 | 类型 | 说明 |
|------|------|------|
| `render` | `(props: CustomRenderProps) => ReactNode?` | custom 类型的自定义渲染函数 |

---

## 支持的字段类型

| type | 渲染组件 | 默认值 | 自动 Zod |
|------|----------|--------|----------|
| `text` | `<Input>` | `''` | `z.string()` |
| `password` | `<Input type="password">` | `''` | `z.string()` |
| `textarea` | `<textarea>` | `''` | `z.string()` |
| `number` | `<Input type="number">` | `undefined` | `z.number()` |
| `boolean` | `<Switch>` | `false` | `z.boolean()` |
| `select` | `<Command>` 组合选择器 | `undefined` | `z.string()` |
| `remote-select` | 远程搜索选择器 | `undefined` | `z.string()` |
| `multiselect` | `<Command>` 多选 | `undefined` | `z.array(z.string())` |
| `tags` | `<Input>` | `''` | `z.string()` |
| `icon` | `<IconPicker>` | `''` | `z.string()` |
| `custom` | 自定义 render | `undefined` | `z.unknown()` |
| `date` | `<Input>` | `undefined` | `z.string()` |
| `datetime` | `<Input>` | `undefined` | `z.string()` |
| `dateRange` | `<Input>` | `undefined` | `z.string()` |

---

## 自动 Schema 生成规则

`buildSchema(fields, t)` 根据字段配置自动生成 Zod schema：

1. **有 `rule`** → 直接使用 `rule`（最高优先级）
2. **`required: true` + 字符串类型** → `z.string().min(1, '字段必填')`
3. **`required: true` + 非字符串** → 基础类型（`z.number()`, `z.boolean()` 等）
4. **`required: false` 或未设置** → 基础类型 `.optional()`

```ts
// required: true 的 text 字段
z.string().min(1, '用户名必填')

// required: true 带自定义 rule
z.string().email('邮箱格式不正确')

// required: false 的 number 字段
z.number().optional()
```

---

## 常见模式

### 编辑模式（create/edit 字段分离）

```ts
// options.ts — 创建和编辑使用不同字段
export function createUserFormFields(t: TFn): FieldConfig[] {
  return [
    { name: 'username', label: '用户名', type: 'text', required: true },
    { name: 'password', label: '密码', type: 'password', required: true },
    { name: 'email', label: '邮箱', type: 'text', required: true },
  ];
}

export function createUserEditFormFields(t: TFn): FieldConfig[] {
  return [
    { name: 'username', label: '用户名', type: 'text', required: true },
    { name: 'email', label: '邮箱', type: 'text', required: true },
    // 编辑时不含 password
  ];
}
```

```tsx
// Dialog 中
const isEdit = !!editUser;
const fields = isEdit ? createUserEditFormFields(t) : createUserFormFields(t);

<ProFormDialog
  editValues={isEdit ? { username: editUser.username, email: editUser.email } : null}
  fields={fields}
  // ...
/>
```

### 异步 Select（动态 options）

options.ts 定义骨架（不含 options），组件里 `.map()` 合并：

```ts
// options.ts
export function createChangeRoleFormFields(t: TFn): FieldConfig[] {
  return [
    { name: 'roleId', label: '角色', type: 'select', required: true },
  ];
}
```

```tsx
// Dialog 组件
const { data: rolesData } = useRequest(() => listAllRoles({ page: 1, pageSize: 999 }), {
  ready: open,
  refreshDeps: [open],
});

const roleOptions = (rolesData?.items ?? []).map((role) => ({
  value: role.id,
  label: role.name,
}));

const fields = createChangeRoleFormFields(t).map((f) =>
  f.name === 'roleId' ? { ...f, options: roleOptions } : f,
);
```

### Custom Render（自定义渲染）

```tsx
import type { CustomRenderProps } from '@/components/form/types';

const fields = createFormFields(t).map((f) => {
  if (f.name === 'expiresAt') {
    return {
      ...f,
      type: 'custom' as const,
      render: (props: CustomRenderProps) => (
        <SmartDateInput
          value={expiresAt || undefined}
          onChange={(val) => setExpiresAt(val ?? '')}
        />
      ),
    };
  }
  return f;
});
```

### 单列表单

```tsx
<ProFormDialog
  fields={fields}
  columns={1}  // 单列布局
  // ...
/>
```

---

## 工具函数

### `createRemoteOptions`

创建远程搜索数据源：

```ts
import { createRemoteOptions } from '@/components/form';

const remoteSource = createRemoteOptions({
  fetcher: (keyword) => searchUsers({ keyword, pageSize: 20 }),
  mapFn: (user) => ({ value: user.id, label: user.name }),
});
```

### `buildSchema` / `buildDefaultValues`

手动构建 schema 和默认值（通常不需要直接调用，ProFormDialog 内部已自动处理）：

```ts
import { buildSchema, buildDefaultValues } from '@/components/form';

const schema = buildSchema(fields, t);
const defaults = buildDefaultValues(fields);
```

---

## 文件结构

```
src/components/form/
├── types.ts                  # FieldConfig, FieldType, SelectOption 等类型
├── pro-form-dialog.tsx       # ProFormDialog 组件
├── pro-form.tsx              # ProForm 布局渲染（grid + 字段分发）
├── form-hook.tsx             # useAppForm + 注册的字段组件（TextField, SelectField 等）
├── form-context.tsx          # TanStack Form context
├── build-schema.ts           # 自动 Zod schema 生成
├── build-default-values.ts   # 自动默认值生成
├── create-remote-options.ts  # 远程搜索数据源工具
└── index.ts                  # 统一导出
```
