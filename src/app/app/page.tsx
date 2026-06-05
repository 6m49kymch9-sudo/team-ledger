'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
  ArrowRightLeft,
  Plus,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EXPENSE_CATEGORIES, Expense, CategoryStat, MemberStat } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from 'recharts'
import { format, startOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const CATEGORY_COLORS: Record<string, string> = {
  catering: '#FF9500',
  hotel: '#5856D6',
  transport: '#007AFF',
  project_cost: '#34C759',
  client_entertainment: '#FF2D55',
  advertising: '#AF52DE',
  office: '#5AC8FA',
  other: '#8E8E93',
}

export default function DashboardPage() {
  const { user, team, teamMembers } = useAuth()
  const [stats, setStats] = useState({
    todayExpense: 0,
    monthExpense: 0,
    memberCount: 0,
    pendingSettlement: 0,
  })
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [memberStats, setMemberStats] = useState<MemberStat[]>([])
  const [trendData, setTrendData] = useState<{ date: string; amount: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (team) {
      fetchDashboardData()
    }
  }, [team])

  const fetchDashboardData = async () => {
    if (!team) return

    const today = startOfDay(new Date())
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())

    // Fetch expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, user:users(*)')
      .eq('team_id', team.id)
      .order('date', { ascending: false })
      .limit(10)

    if (expenses) {
      setRecentExpenses(expenses as unknown as Expense[])

      // Calculate stats
      const todayExp = expenses
        .filter((e) => new Date(e.date) >= today)
        .reduce((sum, e) => sum + Number(e.amount), 0)

      const monthExp = expenses
        .filter((e) => {
          const d = new Date(e.date)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((sum, e) => sum + Number(e.amount), 0)

      setStats({
        todayExpense: todayExp,
        monthExpense: monthExp,
        memberCount: teamMembers.length,
        pendingSettlement: 0,
      })

      // Category stats
      const categoryMap = new Map<string, number>()
      expenses.forEach((e) => {
        const current = categoryMap.get(e.category) || 0
        categoryMap.set(e.category, current + Number(e.amount))
      })

      const total = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
      const catStats: CategoryStat[] = Array.from(categoryMap.entries()).map(
        ([category, amount]) => ({
          category: category as Expense['category'],
          amount,
          count: expenses.filter((e) => e.category === category).length,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        })
      )
      setCategoryStats(catStats.sort((a, b) => b.amount - a.amount))

      // Member stats
      const memberMap = new Map<string, { amount: number; count: number }>()
      expenses.forEach((e) => {
        const current = memberMap.get(e.user_id) || { amount: 0, count: 0 }
        memberMap.set(e.user_id, {
          amount: current.amount + Number(e.amount),
          count: current.count + 1,
        })
      })

      const memStats: MemberStat[] = Array.from(memberMap.entries()).map(
        ([userId, data]) => {
          const member = teamMembers.find((m) => m.user_id === userId)
          return {
            user_id: userId,
            nickname: member?.user?.nickname || member?.nickname || '未知',
            avatar_url: member?.user?.avatar_url,
            total_amount: data.amount,
            count: data.count,
            percentage: total > 0 ? (data.amount / total) * 100 : 0,
          }
        }
      )
      setMemberStats(memStats.sort((a, b) => b.total_amount - a.total_amount))

      // Trend data (last 7 days)
      const trend: { date: string; amount: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i)
        const dayExp = expenses
          .filter((e) => format(new Date(e.date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))
          .reduce((sum, e) => sum + Number(e.amount), 0)
        trend.push({
          date: format(d, 'MM/dd'),
          amount: dayExp,
        })
      }
      setTrendData(trend)
    }

    setLoading(false)
  }

  if (!team) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">加入或创建团队</h2>
            <p className="text-muted-foreground mb-6">
              开始记账之前，请先加入或创建一个团队
            </p>
            <Link href="/app/team">
              <Button>前往团队管理</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">欢迎回来，{user?.nickname}</h1>
          <p className="text-muted-foreground">{format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</p>
        </div>
        <Link href="/app/expenses/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            记一笔
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日支出"
          value={`¥${stats.todayExpense.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={stats.todayExpense > 0 ? '+12%' : undefined}
          trendUp={true}
        />
        <StatCard
          title="本月支出"
          value={`¥${stats.monthExpense.toLocaleString()}`}
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          title="团队成员"
          value={stats.memberCount.toString()}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="待结算"
          value={stats.pendingSettlement.toString()}
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>分类统计</CardTitle>
            <CardDescription>本月支出分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) =>
                        `${EXPENSE_CATEGORIES[name as keyof typeof EXPENSE_CATEGORIES]} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.category] || '#8E8E93'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `¥${Number(value || 0).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryStats.map((stat) => (
                <div
                  key={stat.category}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[stat.category] || '#8E8E93',
                    }}
                  />
                  <span className="text-muted-foreground">
                    {EXPENSE_CATEGORIES[stat.category as keyof typeof EXPENSE_CATEGORIES]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>支出趋势</CardTitle>
            <CardDescription>近7天支出走势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {trendData.some((d) => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `¥${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, '支出']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Ranking & Recent Expenses */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Member Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>成员支出排行</CardTitle>
          </CardHeader>
          <CardContent>
            {memberStats.length > 0 ? (
              <div className="space-y-4">
                {memberStats.slice(0, 5).map((stat, index) => (
                  <div key={stat.user_id} className="flex items-center gap-3">
                    <span className="w-6 text-center font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={stat.avatar_url || ''} />
                      <AvatarFallback>
                        {stat.nickname?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{stat.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.count}笔支出
                      </p>
                    </div>
                    <span className="font-semibold">
                      ¥{stat.total_amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>最近账单</CardTitle>
            </div>
            <Link href="/app/expenses">
              <Button variant="ghost" size="sm" className="gap-1">
                查看全部
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`badge-${expense.category}`}
                        >
                          {EXPENSE_CATEGORIES[expense.category]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {expense.user?.nickname || '未知'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {expense.description || '无备注'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ¥{Number(expense.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'MM/dd')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                暂无账单，<Link href="/app/expenses/new" className="text-primary hover:underline">记一笔</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card className="stat-glow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm">{title}</span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}