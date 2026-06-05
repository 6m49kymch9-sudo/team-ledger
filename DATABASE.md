# Team Ledger - 数据库设计文档 v1.0

## 1. 数据库概览

- **数据库类型**：PostgreSQL
- **托管平台**：Supabase
- **字符编码**：UTF-8
- **时区**：Asia/Shanghai (+08:00)

---

## 2. ER图（实体关系图）

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   users     │────<│  team_members│>────│   teams     │
└─────────────┘     └──────────────┘     └─────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│  expenses   │                          │ invite_codes│
└─────────────┘                          └─────────────┘
       │
       ▼
┌─────────────────┐
│  expense_images │
└─────────────────┘

┌─────────────┐     ┌──────────────┐
│  settlements │<───│ settlement_  │
└─────────────┘     │   members    │
                    └──────────────┘

┌──────────────────┐
│  operation_logs  │
└──────────────────┘
```

---

## 3. 表结构详解

### 3.1 users（用户表）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  wechat_openid VARCHAR(64) UNIQUE,
  nickname VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  CONSTRAINT users_email_or_wechat CHECK (
    email IS NOT NULL OR wechat_openid IS NOT NULL
  )
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wechat_openid ON users(wechat_openid);
```

### 3.2 teams（团队表）

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  invite_code VARCHAR(8) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_invite_code ON teams(invite_code);
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
```

### 3.3 team_members（团队成员表）

```sql
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  nickname VARCHAR(50),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE UNIQUE INDEX idx_team_members_unique ON team_members(team_id, user_id);
```

### 3.4 expenses（支出记录表）

```sql
CREATE TYPE expense_category AS ENUM (
  'catering',    -- 餐饮
  'hotel',       -- 酒店
  'transport',   -- 交通
  'project_cost', -- 项目成本
  'client_entertainment', -- 客户招待
  'advertising', -- 广告
  'office',      -- 办公
  'other'        -- 其它
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT,
  image_url TEXT,
  project_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_team_id ON expenses(team_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_project_name ON expenses(project_name);
CREATE INDEX idx_expenses_team_date ON expenses(team_id, date);
```

### 3.5 expense_images（支出图片表）

```sql
CREATE TABLE expense_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_images_expense_id ON expense_images(expense_id);
```

### 3.6 settlements（结算记录表）

```sql
CREATE TYPE settlement_status AS ENUM ('pending', 'partially_paid', 'settled');
CREATE TYPE settlement_period AS ENUM ('weekly', 'monthly', 'custom');

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  period settlement_period NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  member_count INTEGER NOT NULL,
  per_person_amount DECIMAL(12, 2) NOT NULL,
  status settlement_status DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settlements_team_id ON settlements(team_id);
CREATE INDEX idx_settlements_status ON settlements(status);
```

### 3.7 settlement_members（结算成员表）

```sql
CREATE TABLE settlement_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  should_pay DECIMAL(12, 2) NOT NULL,
  balance DECIMAL(12, 2) NOT NULL, -- 正数=应收，负数=应付
  status settlement_status DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(settlement_id, user_id)
);

CREATE INDEX idx_settlement_members_settlement_id ON settlement_members(settlement_id);
CREATE INDEX idx_settlement_members_user_id ON settlement_members(user_id);
```

### 3.8 settlement_transfers（结算转账记录表）

```sql
CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE settlement_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status transfer_status DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

CREATE INDEX idx_settlement_transfers_settlement_id ON settlement_transfers(settlement_id);
CREATE INDEX idx_settlement_transfers_from_user ON settlement_transfers(from_user_id);
CREATE INDEX idx_settlement_transfers_to_user ON settlement_transfers(to_user_id);
```

### 3.9 operation_logs（操作日志表）

```sql
CREATE TYPE log_action AS ENUM (
  'create', 'update', 'delete', 'login', 'logout', 
  'invite', 'join', 'leave', 'kick', 'transfer'
);

CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  action log_action NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_team_id ON operation_logs(team_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at DESC);
```

---

## 4. Row Level Security (RLS) 策略

### 4.1 用户表策略
```sql
-- 用户只能查看自己的信息
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 4.2 团队表策略
```sql
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 团队成员可以查看团队信息
CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- 只有管理员和所有者可以更新团队
CREATE POLICY "Admins can update teams"
  ON teams FOR UPDATE
  USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### 4.3 账单表策略
```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 团队成员可以查看团队账单
CREATE POLICY "Team members can view expenses"
  ON expenses FOR SELECT
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- 团队成员可以创建账单
CREATE POLICY "Team members can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- 账单创建者和管理员可以更新
CREATE POLICY "Creators and admins can update expenses"
  ON expenses FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 只有创建者可以删除
CREATE POLICY "Creators can delete expenses"
  ON expenses FOR DELETE
  USING (user_id = auth.uid());
```

---

## 5. 辅助函数

### 5.1 生成邀请码
```sql
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 计算最优结算路径
```sql
CREATE OR REPLACE FUNCTION calculate_settlement_transfers(
  p_settlement_id UUID
)
RETURNS TABLE (
  from_user_id UUID,
  to_user_id UUID,
  amount DECIMAL(12, 2)
) AS $$
DECLARE
  creditor RECORD;
  debtor RECORD;
  transfer_amount DECIMAL(12, 2);
BEGIN
  FOR creditor IN 
    SELECT user_id, balance 
    FROM settlement_members 
    WHERE settlement_id = p_settlement_id AND balance > 0
    ORDER BY balance DESC
  LOOP
    FOR debtor IN 
      SELECT user_id, ABS(balance) as debt
      FROM settlement_members 
      WHERE settlement_id = p_settlement_id AND balance < 0
      ORDER BY balance ASC
    LOOP
      IF creditor.balance > 0 AND debtor.debt > 0 THEN
        transfer_amount := LEAST(creditor.balance, debtor.debt);
        IF transfer_amount > 0 THEN
          from_user_id := debtor.user_id;
          to_user_id := creditor.user_id;
          amount := transfer_amount;
          RETURN NEXT;
          creditor.balance := creditor.balance - transfer_amount;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 自动更新 updated_at 触发器
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表创建触发器
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. 数据库版本管理

使用 Supabase Migration 管理数据库版本变更，迁移文件存放在：
```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_indexes.sql
├── 003_add_rls_policies.sql
└── 004_add_functions.sql
```

---

## 7. 初始化数据

### 7.1 测试管理员账号
```sql
INSERT INTO users (email, password_hash, nickname, is_admin)
VALUES (
  'admin@teamledger.com',
  -- bcrypt hash of 'admin123'
  '$2b$10$abcdefghijklmnopqrstuv',
  '系统管理员',
  TRUE
);
```

### 7.2 支出类别字典（代码层面）
```typescript
export const EXPENSE_CATEGORIES = {
  catering: '餐饮',
  hotel: '酒店',
  transport: '交通',
  project_cost: '项目成本',
  client_entertainment: '客户招待',
  advertising: '广告',
  office: '办公',
  other: '其它'
} as const;
```