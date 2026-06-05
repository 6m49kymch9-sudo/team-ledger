# Team Ledger - 产品需求文档 v1.0

## 1. 项目概述

### 项目名称
Team Ledger（团队记账结算系统）

### 项目愿景
让多人团队轻松记录支出、智能自动AA结算、透明展示财务数据。

### 核心价值
- **简化协作**：多人同时记账，无需手动汇总
- **智能结算**：自动计算最优还款路径，减少扯皮
- **透明可视**：实时数据看板，财务状况一目了然

---

## 2. 用户系统

### 2.1 认证方式

#### 微信登录
- 通过微信开放平台 OAuth2.0 授权
- 获取用户昵称、头像、唯一 OpenID
- 首次登录自动创建账户

#### 邮箱登录
- 邮箱 + 密码注册/登录
- 密码使用 bcrypt 加密存储
- 支持"记住我"功能

#### 团队邀请码
- 6位数字字母混合码
- 每个团队独立生成
- 管理员可禁用/重置邀请码

### 2.2 用户信息字段
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| email | varchar(255) | 邮箱（唯一） |
| password_hash | varchar(255) | 加密密码 |
| wechat_openid | varchar(64) | 微信OpenID（唯一） |
| nickname | varchar(50) | 昵称 |
| avatar_url | text | 头像URL |
| phone | varchar(20) | 手机号 |
| created_at | timestamp | 注册时间 |
| updated_at | timestamp | 更新时间 |
| last_login_at | timestamp | 最后登录时间 |

---

## 3. 团队管理

### 3.1 团队信息
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar(100) | 团队名称 |
| description | text | 团队描述 |
| invite_code | varchar(8) | 邀请码（唯一） |
| avatar_url | text | 团队头像 |
| owner_id | uuid | 创建者ID |
| settings | jsonb | 团队设置 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 3.2 成员角色
| 角色 | 权限 |
|------|------|
| owner | 全部权限 |
| admin | 管理成员、查看账单、结算 |
| member | 记录支出、查看账单 |

### 3.3 团队成员表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| team_id | uuid | 团队ID |
| user_id | uuid | 用户ID |
| role | enum | owner/admin/member |
| joined_at | timestamp | 加入时间 |

### 3.4 操作流程
- **创建团队**：填写名称 → 生成邀请码 → 成为owner
- **邀请成员**：分享邀请码 → 对方输入加入
- **删除成员**：管理员操作 → 确认 → 移除
- **设置管理员**：owner操作 → 选择成员 → 确认

---

## 4. 支出记录

### 4.1 账单字段
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| team_id | uuid | 团队ID |
| user_id | uuid | 支出人ID |
| date | date | 支出日期 |
| amount | decimal(12,2) | 金额 |
| category | enum | 类别 |
| description | text | 备注 |
| image_url | text | 图片凭证URL |
| project_name | varchar(100) | 项目名称（可选） |
| created_at | timestamp | 记录时间 |
| updated_at | timestamp | 更新时间 |

### 4.2 支出类别
```
餐饮 | 酒店 | 交通 | 项目成本 | 客户招待 | 广告 | 办公 | 其它
```

### 4.3 图片凭证
- 支持 jpg、png、webp、pdf
- 最大 10MB
- 存储于 Supabase Storage
- 开启 CDN 加速

---

## 5. 自动统计

### 5.1 统计维度
| 统计项 | 说明 |
|--------|------|
| 今日支出 | 当天00:00-23:59总支出 |
| 本月支出 | 当月1日-月末总支出 |
| 本年支出 | 当年1月1日-12月31日总支出 |
| 项目支出 | 按项目名称汇总 |
| 分类统计 | 按8个类别分别汇总 |

### 5.2 成员统计
- 每位成员的总支出金额
- 占比百分比
- 支出笔数

---

## 6. 自动AA结算

### 6.1 计算逻辑
```
人均应付 = 总支出 / 成员数量
每人应收/应付 = 累计支出 - 人均应付
```

### 6.2 结算状态
| 状态 | 说明 |
|------|------|
| pending | 待结算 |
| partially_paid | 部分支付 |
| settled | 已结清 |

### 6.3 最优结算路径
- 算法：贪心算法，优先大额还款
- 目标：最少还款次数完成全部清算
- 输出：每笔转账的发起方、接收方、金额

### 6.4 结算周期
| 周期 | 说明 |
|------|------|
| 周结 | 每周一生成上周报表 |
| 月结 | 每月1日生成上月报表 |
| 自定义 | 指定日期区间 |

---

## 7. 数据看板

### 7.1 图表类型
| 图表 | 用途 |
|------|------|
| 饼图 | 分类占比分析 |
| 柱状图 | 月度/成员对比 |
| 趋势图 | 时间序列走势 |
| 雷达图 | 多维度成员分析 |

### 7.2 排行榜
- 支出总额排行
- 分类支出排行
- 项目成本排行
- 支出笔数排行

---

## 8. 导出功能

### 8.1 导出格式
| 格式 | 适用场景 |
|------|----------|
| Excel(.xlsx) | 财务分析、二次处理 |
| PDF | 正式报表、打印存档 |
| CSV | 数据备份、系统对接 |

### 8.2 导出内容
- 账单明细列表
- 分类汇总报表
- 结算报表
- 成员统计报表

---

## 9. 响应式设计

### 9.1 设备适配
| 设备 | 断点 |
|------|------|
| 手机 | < 640px |
| 平板 | 640px - 1024px |
| 桌面 | > 1024px |

### 9.2 PWA支持
- Service Worker 离线缓存
- App Manifest 安装配置
- 桌面快捷方式
- 启动屏图标

---

## 10. 管理后台

### 10.1 管理员功能
| 功能 | 说明 |
|------|------|
| 所有账单 | 全局账单查询 |
| 所有团队 | 团队管理与统计 |
| 操作日志 | 用户操作审计 |

### 10.2 日志字段
| 字段 | 说明 |
|------|------|
| id | 主键 |
| user_id | 操作人ID |
| action | 操作类型 |
| target_type | 目标类型 |
| target_id | 目标ID |
| details | 详情JSON |
| ip_address | IP地址 |
| created_at | 操作时间 |

---

## 11. UI设计规范

### 11.1 色彩系统
```css
/* 浅色模式 */
--background: #FFFFFF
--surface: #F5F5F7
--text-primary: #1D1D1F
--text-secondary: #6E6E73
--accent: #0071E3
--success: #34C759
--warning: #FF9500
--error: #FF3B30

/* 深色模式 */
--background-dark: #000000
--surface-dark: #1D1D1F
--text-primary-dark: #F5F5F7
--text-secondary-dark: #A1A1A6
--accent-dark: #0A84FF
```

### 11.2 字体系统
- 主字体：SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif
- 数字字体：SF Mono, Menlo, Monaco
- 字重：400(常规), 500(中等), 600(半粗), 700(粗体)

### 11.3 间距系统
```
4px | 8px | 12px | 16px | 24px | 32px | 48px | 64px
```

### 11.4 圆角系统
```
small: 8px | medium: 12px | large: 16px | xl: 24px
```

### 11.5 阴影系统
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)
--shadow-md: 0 4px 12px rgba(0,0,0,0.08)
--shadow-lg: 0 12px 40px rgba(0,0,0,0.12)
```

---

## 12. 技术架构

### 12.1 前端技术栈
- **框架**：Next.js 14 (App Router)
- **样式**：TailwindCSS + Shadcn UI
- **图表**：Recharts
- **状态**：React Context + useReducer
- **表单**：React Hook Form + Zod
- **日期**：date-fns
- **图标**：Lucide React

### 12.2 后端技术栈
- **BaaS**：Supabase
- **数据库**：PostgreSQL
- **存储**：Supabase Storage
- **实时**：Supabase Realtime
- **部署**：Vercel

### 12.3 数据库
- 详见步骤2：数据库设计文档

---

## 13. 页面结构

### 13.1 页面清单
```
/ (Landing页)
/login (登录选择页)
/login/email (邮箱登录)
/login/wechat (微信登录)
/register (注册页)
/app (主应用壳)
  /app/dashboard (数据看板)
  /app/expenses (账单列表)
  /app/expenses/new (新增账单)
  /app/expenses/[id] (账单详情)
  /app/settle (结算中心)
  /app/team (团队管理)
  /app/team/members (成员管理)
  /app/export (导出中心)
  /app/settings (个人设置)
/admin (管理后台)
  /admin/teams (团队管理)
  /admin/expenses (账单管理)
  /admin/logs (操作日志)
```

---

## 14. 安全性设计

### 14.1 认证
- JWT Token 认证
- Token 有效期：7天（记住我）/ 24小时
- Refresh Token 续期机制

### 14.2 授权
- Row Level Security (RLS) 行级安全策略
- 每个用户只能操作自己的数据
- 团队成员只能操作团队内数据

### 14.3 数据安全
- HTTPS 全站加密
- 敏感数据加密存储
- SQL 注入防护
- XSS 防护

---

## 15. 性能指标

| 指标 | 目标值 |
|------|--------|
| 首屏加载 | < 1.5s |
| API 响应 | < 200ms |
| Lighthouse Score | > 90 |
| Core Web Vitals | 全部绿区 |

---

## 16. 里程碑

| 阶段 | 内容 | 时间 |
|------|------|------|
| Phase 1 | 核心功能 MVP | Week 1-2 |
| Phase 2 | 结算与导出 | Week 3 |
| Phase 3 | 数据看板 | Week 4 |
| Phase 4 | 管理后台 | Week 5 |
| Phase 5 | PWA & 优化 | Week 6 |