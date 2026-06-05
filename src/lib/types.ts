// Team Ledger - 全局类型定义

export type MemberRole = 'owner' | 'admin' | 'member'

export type ExpenseCategory =
  | 'catering'
  | 'hotel'
  | 'transport'
  | 'project_cost'
  | 'client_entertainment'
  | 'advertising'
  | 'office'
  | 'other'

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  catering: '餐饮',
  hotel: '酒店',
  transport: '交通',
  project_cost: '项目成本',
  client_entertainment: '客户招待',
  advertising: '广告',
  office: '办公',
  other: '其它',
}

export const EXPENSE_CATEGORY_LIST = Object.entries(EXPENSE_CATEGORIES).map(
  ([value, label]) => ({ value, label })
)

export type SettlementStatus = 'pending' | 'partially_paid' | 'settled'

export type SettlementPeriod = 'weekly' | 'monthly' | 'custom'

export type TransferStatus = 'pending' | 'completed' | 'cancelled'

export type LogAction =
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

// User 相关类型
export interface User {
  id: string
  email?: string
  nickname: string
  avatar_url?: string
  phone?: string
  is_admin: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  description?: string
  avatar_url?: string
  invite_code: string
  owner_id: string
  settings?: Record<string, unknown>
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: MemberRole
  nickname?: string
  joined_at: string
  user?: User
}

export interface Expense {
  id: string
  team_id: string
  user_id: string
  date: string
  amount: number
  category: ExpenseCategory
  description?: string
  image_url?: string
  project_name?: string
  created_at: string
  user?: User
}

export interface ExpenseImage {
  id: string
  expense_id: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  created_at: string
}

export interface Settlement {
  id: string
  team_id: string
  period: SettlementPeriod
  start_date: string
  end_date: string
  total_amount: number
  member_count: number
  per_person_amount: number
  status: SettlementStatus
  settled_at?: string
  created_at: string
}

export interface SettlementMember {
  id: string
  settlement_id: string
  user_id: string
  total_paid: number
  should_pay: number
  balance: number // 正数=应收，负数=应付
  status: SettlementStatus
  settled_at?: string
  user?: User
}

export interface SettlementTransfer {
  id: string
  settlement_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  status: TransferStatus
  completed_at?: string
  created_at: string
  from_user?: User
  to_user?: User
}

export interface OperationLog {
  id: string
  user_id?: string
  team_id?: string
  action: LogAction
  target_type: string
  target_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
}

// 统计数据类型
export interface DashboardStats {
  todayExpense: number
  monthExpense: number
  memberCount: number
  pendingSettlement: number
}

export interface CategoryStat {
  category: ExpenseCategory
  amount: number
  count: number
  percentage: number
}

export interface MemberStat {
  user_id: string
  nickname: string
  avatar_url?: string
  total_amount: number
  count: number
  percentage: number
}

export interface TrendData {
  date: string
  amount: number
}

export interface SettlementResult {
  total_amount: number
  member_count: number
  per_person_amount: number
  members: {
    user_id: string
    nickname: string
    total_paid: number
    should_pay: number
    balance: number // 正数=应收，负数=应付
  }[]
  transfers: {
    from_user_id: string
    from_nickname: string
    to_user_id: string
    to_nickname: string
    amount: number
  }[]
}