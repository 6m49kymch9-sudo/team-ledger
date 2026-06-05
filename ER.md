# Team Ledger - ER Diagram

## 1. 实体关系图（Mermaid格式）

### 1.1 核心实体关系

```mermaid
erDiagram
USERS ||--o{ TEAM_MEMBERS : "加入"
USERS ||--o{ EXPENSES : "记录支出"
USERS ||--o{ SETTLEMENT_MEMBERS : "参与结算"
USERS ||--o{ OPERATION_LOGS : "操作日志"

TEAMS ||--o{ TEAM_MEMBERS : "拥有成员"
TEAMS ||--o{ EXPENSES : "包含账单"
TEAMS ||--o{ SETTLEMENTS : "发起结算"

EXPENSES ||--o{ EXPENSE_IMAGES : "附带图片"

SETTLEMENTS ||--o{ SETTLEMENT_MEMBERS : "结算成员"
SETTLEMENTS ||--o{ SETTLEMENT_TRANSFERS : "转账记录"
```

### 1.2 完整ER图

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar wechat_openid UK
        varchar nickname
        text avatar_url
        varchar phone
        boolean email_verified
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_login_at
        boolean is_admin
    }

    TEAMS {
        uuid id PK
        varchar name
        text description
        text avatar_url
        varchar invite_code UK
        uuid owner_id FK
        jsonb settings
        timestamptz created_at
        timestamptz updated_at
    }

    TEAM_MEMBERS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        member_role role
        varchar nickname
        timestamptz joined_at
    }

    EXPENSES {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        date date
        decimal amount
        expense_category category
        text description
        text image_url
        varchar project_name
        timestamptz created_at
        timestamptz updated_at
    }

    EXPENSE_IMAGES {
        uuid id PK
        uuid expense_id FK
        varchar file_name
        text file_url
        integer file_size
        varchar mime_type
        timestamptz created_at
    }

    SETTLEMENTS {
        uuid id PK
        uuid team_id FK
        settlement_period period
        date start_date
        date end_date
        decimal total_amount
        integer member_count
        decimal per_person_amount
        settlement_status status
        timestamptz settled_at
        timestamptz created_at
        timestamptz updated_at
    }

    SETTLEMENT_MEMBERS {
        uuid id PK
        uuid settlement_id FK
        uuid user_id FK
        decimal total_paid
        decimal should_pay
        decimal balance
        settlement_status status
        timestamptz settled_at
        timestamptz created_at
    }

    SETTLEMENT_TRANSFERS {
        uuid id PK
        uuid settlement_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        decimal amount
        transfer_status status
        timestamptz completed_at
        timestamptz created_at
        text note
    }

    OPERATION_LOGS {
        uuid id PK
        uuid user_id FK
        uuid team_id FK
        log_action action
        varchar target_type
        uuid target_id
        jsonb details
        inet ip_address
        text user_agent
        timestamptz created_at
    }

    USERS ||--o{ TEAM_MEMBERS : "members"
    TEAMS ||--o{ TEAM_MEMBERS : "has"
    TEAM_MEMBERS }o--|| TEAMS : "belongs to"
    USERS }o--|| TEAMS : "owns"
    TEAMS ||--o{ EXPENSES : "contains"
    USERS ||--o{ EXPENSES : "creates"
    EXPENSES ||--o{ EXPENSE_IMAGES : "has"
    TEAMS ||--o{ SETTLEMENTS : "initiates"
    SETTLEMENTS ||--o{ SETTLEMENT_MEMBERS : "includes"
    SETTLEMENTS ||--o{ SETTLEMENT_TRANSFERS : "generates"
    SETTLEMENT_TRANSFERS }o--|| USERS : "from"
    SETTLEMENT_TRANSFERS }o--|| USERS : "to"
```

## 2. 数据流向图

```mermaid
flowchart TD
    subgraph 用户认证
        A[用户登录] --> B{认证方式}
        B -->|邮箱| C[邮箱登录]
        B -->|微信| D[微信授权]
    end

    subgraph 团队管理
        E[创建团队] --> F[生成邀请码]
        F --> G[邀请成员]
        G --> H[成员加入]
        H --> I[设置角色]
    end

    subgraph 支出记录
        J[记录支出] --> K[选择类别]
        K --> L[上传凭证]
        L --> M[保存账单]
    end

    subgraph 结算流程
        N[发起结算] --> O[计算总额]
        O --> P[AA分摊]
        P --> Q[生成转账方案]
        Q --> R[执行转账]
    end

    subgraph 数据分析
        S[统计看板] --> T[分类饼图]
        S --> U[趋势图]
        S --> V[成员排行]
    end
```

## 3. 页面路由与数据关联

```mermaid
flowchart LR
    subgraph /app/dashboard
        A1[数据看板]
    end

    subgraph /app/expenses
        A2[账单列表]
        A3[新增账单]
        A4[编辑账单]
    end

    subgraph /app/settle
        A5[结算中心]
        A6[结算详情]
    end

    subgraph /app/team
        A7[团队设置]
        A8[成员管理]
    end

    subgraph /app/export
        A9[导出中心]
    end

    subgraph /admin
        A10[管理后台]
    end

    A1 -->|读取| EXP[支出数据]
    A2 -->|读取| EXP
    A3 -->|写入| EXP
    A5 -->|读取| SET[结算数据]
    A7 -->|读取| TM[团队成员]
    A9 -->|读取| EXP
    A10 -->|管理| ALL[全部数据]
```

## 4. 枚举类型定义

```typescript
// 用户角色
type MemberRole = 'owner' | 'admin' | 'member'

// 支出类别
type ExpenseCategory = 
  | 'catering'     // 餐饮
  | 'hotel'        // 酒店
  | 'transport'    // 交通
  | 'project_cost' // 项目成本
  | 'client_entertainment' // 客户招待
  | 'advertising'  // 广告
  | 'office'       // 办公
  | 'other'        // 其它

// 结算状态
type SettlementStatus = 'pending' | 'partially_paid' | 'settled'

// 结算周期
type SettlementPeriod = 'weekly' | 'monthly' | 'custom'

// 转账状态
type TransferStatus = 'pending' | 'completed' | 'cancelled'

// 操作类型
type LogAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'invite' 
  | 'join' 
  | 'leave' 
  | 'kick' 
  | 'transfer'
```

## 5. 数据库索引概览

| 表名 | 索引类型 | 索引字段 |
|------|---------|---------|
| users | UNIQUE | email |
| users | UNIQUE | wechat_openid |
| teams | UNIQUE | invite_code |
| teams | INDEX | owner_id |
| team_members | UNIQUE | (team_id, user_id) |
| team_members | INDEX | team_id |
| team_members | INDEX | user_id |
| expenses | INDEX | team_id, date |
| expenses | INDEX | user_id |
| expenses | INDEX | category |
| expenses | INDEX | project_name |
| settlements | INDEX | team_id |
| settlements | INDEX | status |
| operation_logs | INDEX | created_at DESC |
| operation_logs | INDEX | user_id |
| operation_logs | INDEX | team_id |