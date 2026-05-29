# knota-studio

knota-fold 平台的管理前端。基于 React 19 + TypeScript 6 + Rsbuild 2，作为多租户企业应用底座的 UI 层。

## 功能

- 认证与授权：JWT 登录、图片验证码、账户锁定防护
- 多租户管理：租户 CRUD、角色模板、权限分配
- 系统管理：用户、角色、菜单、字典、配置中心
- 国际化：运行时翻译加载、ETag 缓存、CI 自动提取
- 文件管理：上传、引用管理
- 审计与日志：审计日志查看、应用日志追踪
- 通知公告：系统公告 + 租户级通知
- AI Agent：页面能力注册、知识库问答、SSE 流式响应
- 暗色模式 / 响应式布局 / 可折叠侧边栏

## 前置条件

- Node.js 22+
- pnpm 10+
- knota-fold 后端运行在 `http://localhost:5150`

## 快速开始

```bash
pnpm install
pnpm dev
```

前端运行在 [http://localhost:3000](http://localhost:3000)，`/api/` 请求自动代理到后端 5150 端口。

```bash
# 生产构建
pnpm build     # → dist/

# 代码检查
pnpm check     # Biome + TypeScript
```

## 生产部署

使用项目提供的 Dockerfile（多阶段：pnpm → Caddy）：

```bash
docker build -t knota-studio .
docker run -p 80:80 -e BACKEND_HOST=<backend-ip> knota-studio
```

Caddy 自动处理安全头、限流、API 反向代理和 SPA fallback。详见 `Caddyfile`。

## 项目结构

```
src/
├── api/              # API 客户端 + 领域模块
│   ├── client.ts     # fetch 封装（自动 Token、错误处理、SSE）
│   └── *.ts          # 各领域 API（auth, users, roles, …）
├── components/       # 通用组件
│   ├── ui/           # shadcn/ui 组件（Radix 基元）
│   ├── pro-table/    # CRUD 表格（搜索、分页、列配置）
│   ├── form/         # 声明式表单（TanStack Form + Zod）
│   └── data-table/   # 底层表格组件
├── i18n/             # 运行时翻译系统
├── pages/            # 页面（login, dashboard, system/*）
├── stores/           # 状态管理（Auth Context, Agent Zustand）
├── layout/           # 主布局（侧边栏、面包屑、通知）
├── types/            # 共享类型定义
└── utils/            # 工具函数
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm check` | Biome lint + TypeScript 检查 |
| `pnpm lint:fix` | 自动修复 lint 问题 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm i18n:extract` | 提取翻译键并上传到后端 |
| `pnpm i18n:fix-conflicts` | 解决 i18n 源文本冲突 |
