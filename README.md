# Team Ledger - 团队记账结算系统

一款面向多人团队的智能记账结算工具，支持AA分摊、数据看板、结算报表。

## 功能特性

- ✅ **用户系统** - 邮箱登录、微信登录、团队邀请码
- ✅ **团队管理** - 创建/加入团队、邀请成员、角色管理
- ✅ **支出记录** - 支持8大类别、图片凭证、项目关联
- ✅ **自动统计** - 今日/本月支出、分类统计、成员统计
- ✅ **智能AA结算** - 自动计算最优结算路径
- ✅ **结算中心** - 周结/月结/自定义结算周期
- ✅ **数据看板** - 饼图、柱状图、趋势图
- ✅ **导出功能** - 支持 Excel、PDF、CSV
- ✅ **PWA支持** - 可安装到桌面/手机
- ✅ **深色模式** - Apple风格设计

## 技术栈

- **前端**: Next.js 14, TailwindCSS, Shadcn UI, Recharts
- **后端**: Supabase (Auth + Database + Storage)
- **部署**: Vercel

## 快速开始

### 1. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 在 SQL Editor 执行 `supabase/migrations/001_initial_schema.sql`
3. 获取 API Keys 配置到 `.env.local`

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 打开应用

访问 http://localhost:3000

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # 主布局
│   │   ├── dashboard/     # 数据看板
│   │   ├── expenses/      # 账单管理
│   │   ├── settle/        # 结算中心
│   │   ├── team/          # 团队管理
│   │   └── export/        # 导出中心
│   ├── login/             # 登录页
│   └── register/          # 注册页
├── components/
│   └── ui/               # Shadcn UI 组件
└── lib/
    ├── auth-context.tsx   # 认证上下文
    ├── supabase.ts        # Supabase 客户端
    └── types.ts           # 类型定义
```

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 部署到 Vercel

1. Push 代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. Deploy

## 默认管理员账号

创建账号后管理员需手动设置数据库 `is_admin = true`

## 许可证

MIT