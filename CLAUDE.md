# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Change what's needed. Nothing else.**

- Prefer one-line fixes to multi-line rewrites.
- Prefer deleting code over adding code.
- Prefer local changes over refactors.
- Don't restructure existing code to "match patterns."
- Don't rename variables, reorder functions, or "clean up" unrelated code.

The goal: make the diff as small as possible while fully solving the problem.

## 4. Knowledge vs. Code

**Be precise. Don't guess APIs. Don't hallucinate.**

- If you don't know an API, say "I don't know" instead of inventing.
- If you can't verify the behavior, don't assume.
- Prioritize reading existing code patterns over writing new code.
- Use the codebase as your source of truth - it overrides general knowledge.
- If trying something speculative, add a comment explaining why you're unsure.

## 5. Verify Correctness

**Don't assume it works. Prove it does.**

- After changes, run type checking and tests before declaring done.
- Think about edge cases: empty states, loading, errors, race conditions.
- Trace through the logic for non-obvious code paths.
- If correctness is hard to verify, simplify until it's obvious.
- For complex logic, document why this approach is correct, not what it does.

## 6. Progress Efficiency

**Save time. Stay focused.**

- Use parallel exploration when possible.
- Don't repeat yourself - read file once, reuse knowledge.
- If blocked for >2 minutes, ask or switch approach.
- Batch related changes rather than round-tripping per file.

---

# 扬光财务管理系统 (yg-cwgl) - 项目说明

## 技术栈
- 前端: React 19 + TypeScript + Ant Design v6 + Vite 8 + TanStack Query + Zustand + React Router v7
- 后端: NestJS v11 + Prisma v7 + PostgreSQL 16 + JWT认证
- 包管理: npm

## 项目结构
```
yg-cwgl/
├── frontend/           # React 前端
│   └── src/
│       ├── api/client.ts       # Axios 实例，baseURL: localhost:12500
│       ├── stores/authStore.ts # Zustand 认证状态管理
│       ├── layouts/MainLayout.tsx  # 侧边栏+顶栏布局
│       ├── App.tsx             # 路由配置
│       └── pages/
│           ├── login/          # 登录页
│           ├── dashboard/      # 工作台首页
│           ├── subjects/       # 会计科目
│           ├── accounts/       # 银行账户
│           ├── counterparties/ # 往来单位
│           ├── transactions/   # 内部流水
│           ├── bank/           # 银行流水导入
│           ├── reconciliation/ # 对账管理+余额调节表
│           ├── receivables/    # 应收账款
│           ├── payables/       # 应付账款
│           ├── fund/           # 资金看板+日报+项目资金
│           ├── financing/      # 融资管理(看板/计划/授信/贷款)
│           ├── shareholders/   # 股东资金
│           ├── reports/        # 报表中心
│           └── users/          # 用户管理
│
└── backend/            # NestJS 后端
    └── src/
        ├── main.ts            # 启动入口，CORS配置
        ├── app.module.ts      # 模块汇总
        ├── prisma/            # PrismaService
        ├── auth/              # JWT认证(login/me/change-password)
        ├── common/            # 装饰器、守卫、类型
        ├── users/             # 用户管理
        ├── subjects/          # 会计科目
        ├── accounts/          # 银行账户
        ├── counterparties/    # 往来单位
        ├── transactions/      # 内部流水
        ├── bank-statements/   # 银行流水导入
        ├── reconciliation/    # 对账引擎
        ├── receivables/       # 应收账款
        ├── payables/          # 应付账款
        ├── fund/              # 资金看板
        ├── reports/           # 报表
        ├── financing/         # 融资管理
        ├── shareholders/      # 股东资金
        └── upload/            # 文件上传
```

## 开发规范

### API 响应格式
所有 API 返回统一格式: `{ code: 0, message: 'success', data: ... }`

### 权限角色
- admin: 全部权限（含用户管理）
- finance: 财务操作
- leader: 查看+审批
- viewer: 只读

### 前端规范
- Ant Design v6: 使用 `styles.content` 替代已弃用的 `valueStyle`
- Modal 使用 `destroyOnHidden` 替代已弃用的 `destroyOnClose`
- 数据请求使用 TanStack Query (`useQuery`/`useMutation`)
- 状态管理使用 Zustand

### 后端规范
- 所有 API 路由需加 `@UseGuards(JwtAuthGuard)`
- Prisma 查询参数中 `page`/`pageSize` 需用 `Number()` 转换
- Prisma v7 需用 `PrismaPg` adapter + `Pool` 连接
- 构建后需执行 postbuild 脚本修复 Prisma client 的 `import.meta.url`

### 启动方式
```bash
# 推荐：使用根目录脚本（不会影响其他项目）
./dev.sh start     # 启动
./dev.sh stop      # 停止
./dev.sh restart   # 重启

# 或手动分步启动
# 后端
cd backend && npm run start:dev

# 前端
cd frontend && npx vite --host 0.0.0.0 --port 12501
```

### 运行端口
- 前端: 12501
- 后端: 12500
- 数据库: PostgreSQL 5432 (yg_cwgl)

### 测试账号
- admin / admin123 (管理员)
- finance / finance123 (财务)
- leader / leader123 (领导)
