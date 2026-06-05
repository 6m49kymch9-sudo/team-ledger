'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settlement, SettlementResult, MemberStat } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Check, ArrowRight, Users, DollarSign, Receipt, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettlePage() {
  const { user, team, teamMembers } = useAuth()
  const router = useRouter()
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'custom'>('monthly')
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  })
  const [settlementResult, setSettlementResult] = useState<SettlementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Settlement[]>([])

  useEffect(() => {
    if (team) {
      calculateSettlement()
      fetchHistory()
    }
  }, [team, period, dateRange])

  const fetchHistory = async () => {
    if (!team) return

    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('team_id', team.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setHistory(data as unknown as Settlement[])
    }
  }

  const calculateSettlement = async () => {
    if (!team) return
    setLoading(true)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, user:users(*)')
      .eq('team_id', team.id)
      .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.end, 'yyyy-MM-dd'))

    if (expenses) {
      const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const memberCount = teamMembers.length
      const perPersonAmount = memberCount > 0 ? totalAmount / memberCount : 0

      // Calculate each member's contribution
      const memberMap = new Map<string, { nickname: string; paid: number }>()
      expenses.forEach((e) => {
        const current = memberMap.get(e.user_id) || { nickname: e.user?.nickname || '未知', paid: 0 }
        memberMap.set(e.user_id, {
          nickname: current.nickname,
          paid: current.paid + Number(e.amount),
        })
      })

      const members = Array.from(memberMap.entries()).map(([userId, data]) => ({
        user_id: userId,
        nickname: data.nickname,
        total_paid: data.paid,
        should_pay: perPersonAmount,
        balance: data.paid - perPersonAmount, // positive = receivable, negative = payable
      }))

      // Calculate optimal transfer paths (greedy algorithm)
      const transfers: SettlementResult['transfers'] = []
      const creditors = members.filter((m) => m.balance > 0).sort((a, b) => b.balance - a.balance)
      const debtors = members.filter((m) => m.balance < 0).sort((a, b) => a.balance - b.balance)

      for (const creditor of creditors) {
        for (const debtor of debtors) {
          if (creditor.balance > 0 && debtor.balance < 0) {
            const amount = Math.min(creditor.balance, Math.abs(debtor.balance))
            if (amount > 0.01) {
              transfers.push({
                from_user_id: debtor.user_id,
                from_nickname: debtor.nickname,
                to_user_id: creditor.user_id,
                to_nickname: creditor.nickname,
                amount: Math.round(amount * 100) / 100,
              })
              creditor.balance -= amount
              debtor.balance += amount
            }
          }
        }
      }

      setSettlementResult({
        total_amount: totalAmount,
        member_count: memberCount,
        per_person_amount: Math.round(perPersonAmount * 100) / 100,
        members,
        transfers,
      })
    }

    setLoading(false)
  }

  const confirmSettlement = async () => {
    if (!team || !settlementResult) return

    setLoading(true)

    const { data: settlement } = await supabase
      .from('settlements')
      .insert({
        team_id: team.id,
        period,
        start_date: format(dateRange.start, 'yyyy-MM-dd'),
        end_date: format(dateRange.end, 'yyyy-MM-dd'),
        total_amount: settlementResult.total_amount,
        member_count: settlementResult.member_count,
        per_person_amount: settlementResult.per_person_amount,
        status: 'settled',
        settled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (settlement) {
      // Insert settlement members
      for (const member of settlementResult.members) {
        await supabase.from('settlement_members').insert({
          settlement_id: (settlement as unknown as Settlement).id,
          user_id: member.user_id,
          total_paid: member.total_paid,
          should_pay: member.should_pay,
          balance: member.balance,
          status: 'settled',
          settled_at: new Date().toISOString(),
        })
      }

      // Insert transfers
      for (const transfer of settlementResult.transfers) {
        await supabase.from('settlement_transfers').insert({
          settlement_id: (settlement as unknown as Settlement).id,
          from_user_id: transfer.from_user_id,
          to_user_id: transfer.to_user_id,
          amount: transfer.amount,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
      }

      fetchHistory()
    }

    setLoading(false)
  }

  if (!team) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">请先创建或加入团队</p>
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
          <h1 className="text-2xl font-bold">结算中心</h1>
          <p className="text-muted-foreground">自动计算最优结算方案</p>
        </div>
      </div>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">周结</TabsTrigger>
          <TabsTrigger value="monthly">月结</TabsTrigger>
          <TabsTrigger value="custom">自定义</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-muted-foreground">
                本周：{format(startOfWeek(new Date()), 'MM/dd')} - {format(endOfWeek(new Date()), 'MM/dd')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-muted-foreground">
                本月：{format(startOfMonth(new Date()), 'yyyy年MM月')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              自定义日期范围功能开发中
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settlement Summary */}
      {settlementResult && (
        <Card className="stat-glow">
          <CardHeader>
            <CardTitle>结算摘要</CardTitle>
            <CardDescription>
              {format(dateRange.start, 'yyyy/MM/dd')} - {format(dateRange.end, 'yyyy/MM/dd')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  ¥{settlementResult.total_amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">总支出</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {settlementResult.member_count}
                </p>
                <p className="text-sm text-muted-foreground">成员</p>
              </div>
              <div className="text-center">
                <Receipt className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  ¥{settlementResult.per_person_amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">人均</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Balances */}
      {settlementResult && (
        <Card>
          <CardHeader>
            <CardTitle>成员结算明细</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settlementResult.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{member.nickname}</p>
                    <p className="text-sm text-muted-foreground">
                      已付 ¥{member.total_paid.toLocaleString()} / 应付 ¥
                      {member.should_pay.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {member.balance >= 0 ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          应收
                        </Badge>
                        <span className="font-bold text-green-500">
                          ¥{member.balance.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          应付
                        </Badge>
                        <span className="font-bold text-red-500">
                          ¥{Math.abs(member.balance).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Paths */}
      {settlementResult && settlementResult.transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最优结算路径</CardTitle>
            <CardDescription>
              最少 {settlementResult.transfers.length} 笔转账即可完成清算
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settlementResult.transfers.map((transfer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-4 p-4 rounded-lg bg-primary/5"
                >
                  <div className="text-center">
                    <Avatar className="w-10 h-10 mx-auto mb-1">
                      <AvatarFallback>
                        {transfer.from_nickname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{transfer.from_nickname}</p>
                    <p className="text-xs text-muted-foreground">付款方</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    <span className="font-bold text-lg">
                      ¥{transfer.amount.toLocaleString()}
                    </span>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <Avatar className="w-10 h-10 mx-auto mb-1">
                      <AvatarFallback>
                        {transfer.to_nickname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{transfer.to_nickname}</p>
                    <p className="text-xs text-muted-foreground">收款方</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Button */}
      {settlementResult && settlementResult.total_amount > 0 && (
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={confirmSettlement}
          disabled={loading}
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4" />
              处理中...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              确认结算
            </>
          )}
        </Button>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>结算历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(item.start_date), 'MM/dd')} -{' '}
                      {format(new Date(item.end_date), 'MM/dd')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.period === 'weekly' ? '周结' : item.period === 'monthly' ? '月结' : '自定义'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{Number(item.total_amount).toLocaleString()}</p>
                    <Badge
                      variant="outline"
                      className={item.status === 'settled' ? 'bg-green-500/10 text-green-500' : ''}
                    >
                      {item.status === 'settled' ? '已结清' : item.status === 'pending' ? '待结算' : '部分支付'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}