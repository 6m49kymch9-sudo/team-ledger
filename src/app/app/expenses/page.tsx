'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EXPENSE_CATEGORIES, Expense } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Search, Filter, Download, Calendar, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ExpensesPage() {
  const { user, team, teamMembers } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  useEffect(() => {
    if (team) {
      fetchExpenses()
    }
  }, [team])

  const fetchExpenses = async () => {
    if (!team) return

    const { data } = await supabase
      .from('expenses')
      .select('*, user:users(*)')
      .eq('team_id', team.id)
      .order('date', { ascending: false })

    if (data) {
      setExpenses(data as unknown as Expense[])
    }
    setLoading(false)
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      searchTerm === '' ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.project_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || expense.category === categoryFilter

    const matchesMember =
      memberFilter === 'all' || expense.user_id === memberFilter

    return matchesSearch && matchesCategory && matchesMember
  })

  // Group expenses by month
  const groupedExpenses = filteredExpenses.reduce(
    (groups, expense) => {
      const month = format(new Date(expense.date), 'yyyy年MM月')
      if (!groups[month]) {
        groups[month] = []
      }
      groups[month].push(expense)
      return groups
    },
    {} as Record<string, Expense[]>
  )

  if (!team) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">请先创建或加入团队</p>
            <Link href="/app/team" className="mt-4 inline-block">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">账单列表</h1>
          <p className="text-muted-foreground">共 {filteredExpenses.length} 笔支出</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/export">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              导出
            </Button>
          </Link>
          <Link href="/app/expenses/new">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              新增
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索备注或项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={memberFilter} onValueChange={(v) => setMemberFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="全部成员" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部成员</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.user?.nickname || member.nickname || '未知'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg shimmer" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {expenses.length === 0 ? '暂无账单记录' : '没有找到匹配的账单'}
            </p>
            {expenses.length === 0 && (
              <Link href="/app/expenses/new">
                <Button>记一笔</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([month, monthExpenses]) => (
            <div key={month}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {month}
              </h3>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {monthExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={expense.user?.avatar_url || ''}
                        />
                        <AvatarFallback>
                          {expense.user?.nickname?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`badge-${expense.category}`}
                          >
                            {
                              EXPENSE_CATEGORIES[
                                expense.category as keyof typeof EXPENSE_CATEGORIES
                              ]
                            }
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {expense.user?.nickname || '未知'}
                          </span>
                          {expense.image_url && (
                            <ImageIcon className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm truncate">
                          {expense.description || '无备注'}
                        </p>
                        {expense.project_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            项目：{expense.project_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          ¥{Number(expense.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), 'MM/dd')}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent>
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle>账单详情</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedExpense.user?.avatar_url || ''} />
                    <AvatarFallback>
                      {selectedExpense.user?.nickname?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedExpense.user?.nickname || '未知'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(selectedExpense.date),
                        'yyyy年MM月dd日 EEEE',
                        { locale: zhCN }
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">金额</p>
                    <p className="text-2xl font-bold">
                      ¥{Number(selectedExpense.amount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">分类</p>
                    <Badge
                      variant="outline"
                      className={`badge-${selectedExpense.category}`}
                    >
                      {
                        EXPENSE_CATEGORIES[
                          selectedExpense.category as keyof typeof EXPENSE_CATEGORIES
                        ]
                      }
                    </Badge>
                  </div>
                </div>
                {selectedExpense.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">备注</p>
                    <p className="mt-1">{selectedExpense.description}</p>
                  </div>
                )}
                {selectedExpense.project_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">项目</p>
                    <p className="mt-1">{selectedExpense.project_name}</p>
                  </div>
                )}
                {selectedExpense.image_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">凭证</p>
                    <img
                      src={selectedExpense.image_url}
                      alt="凭证"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/app/expenses/${selectedExpense.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      编辑
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (confirm('确定删除这笔账单？')) {
                        await supabase
                          .from('expenses')
                          .delete()
                          .eq('id', selectedExpense.id)
                        setSelectedExpense(null)
                        fetchExpenses()
                      }
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}