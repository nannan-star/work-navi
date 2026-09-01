# work-navi · 项目资源导航台

前后端一体、个人自用的「项目资源导航台」。按项目组织，集中记录每个项目分散在各处的资源环境——访问地址、服务器 / 部署信息、数据库 / 中间件、凭证密钥，以及每周的任务周记。

## 技术栈

- **Next.js 15**（App Router + Route Handlers，Server Components + Client Components）
- **TypeScript** + React 19
- **SQLite** + **Prisma**（零配置，数据落在 `prisma/dev.db`）
- 无第三方状态库，客户端用 `useState` + `fetch` 直连 API

## 功能

- **项目导航台**：左侧项目列表 + 搜索（快捷键 `/`），右侧按分类（需求 / 环境 / 任务 / 原型 / Git / 其他）分组展示资源卡片。
- **资源卡片**：链接点击跳转、用户名 / 密码掩码显示 + 一键复制、非 HTTP 连接串复制、编辑 / 删除。
- **任务周记**：按 ISO 周（周一开始）组织，当前周在主界面直接编辑自动保存，历史周可逐周查看 / 编辑，另有单独的历史管理页。
- **分类管理**：新增 / 删除自定义分类（分类下有资源时禁止删除）。

## 数据模型

- `Project` — 项目（名称、简介、颜色、排序）
- `Category` — 资源分类（名称、颜色、排序）
- `Resource` — 资源（所属项目 + 分类、标题、链接、备注、用户名、密码明文）
- `WeekNote` — 周记（ISO 年 / 周、起止日期、内容）

> ⚠️ **密码明文存储**，服务仅监听 `localhost`，仅供本机个人使用。若日后要部署到公网，必须先加身份认证并对密码加密。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库（生成 dev.db）
npm run prisma:push

# 3. 预置演示数据（5 分类 / 3 项目 / 15 资源 / 4 周周记）
npm run db:seed

# 4. 启动开发服务器
npm run dev
```

打开 <http://localhost:3000> 即可使用。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 运行生产构建 |
| `npm run prisma:push` | 将 schema 同步到 SQLite |
| `npm run prisma:generate` | 重新生成 Prisma Client |
| `npm run db:seed` | 重置并写入预置数据 |
| `npx prisma studio` | 可视化查看 / 编辑数据库 |

## 目录结构

```
work-navi/
├── prisma/
│   ├── schema.prisma          # 数据模型
│   └── seed.ts                # 预置数据
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 全局布局 + 字体
│   │   ├── page.tsx           # 首页（服务端拉数据）
│   │   └── api/               # Route Handlers（projects / resources / categories / weeknotes）
│   ├── components/            # Sidebar / ProjectView / TasksView / 各表单与弹窗
│   └── lib/                   # db.ts（Prisma 单例）、week.ts（ISO 周）、colors.ts
└── ...
```
