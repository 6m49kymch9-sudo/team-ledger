'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { INCOME_CATEGORIES, Income } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Search, ImageIcon, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function IncomesPage() {
  const { team, teamMembers } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)

  useEffect(() => {
    if (team) fetchIncomes()
  }, [team])

  const fetchIncomes = async () => {
    if (!team) return
    const { data } = await supabase.from('incomes').select('*, user:users(*)').eq('team_id', team.id).order('date', { ascending: false })
    if (data) setIncomes(data as unknown as Income[])
    setLoading(false)
  }

  const filteredIncomes = incomes.filter((income) => {
    const matchesSearch = searchTerm === '' || income.description?.toLowerCase().includes(searchTerm.toLowerCase()) || income.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || income.category === categoryFilter
    const matchesMember = memberFilter === 'all' || income.user_id === memberFilter
    return matchesSearch && matchesCategory && matchesMember
  })

  const groupedIncomes = filteredIncomes.reduce((groups, income) => {
    const month = format(new Date(income.date), 'yyyy年MM月')
    if (!groups[month]) groups[month] = []
    groups[month].push(income)
    return groups
  }, {} as Record<string, Income[]>)

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + Number(income.amount), 0)

  if (!team) return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-8 text-center">
        <CardContent className="p-0">
          <p className="text-muted-foreground">请先创建或加入团队</p>
          <Link href="/app/team" className="mt-4 inline-block"><Button>前往团队管理</Button></Link>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">收入记录</h1>
          <p className="text-muted-foreground">共 {filteredIncomes.length} 笔收入，合计 ¥{totalIncome.toLocaleString()}</p>
        </div>
        <Link href="/app/incomes/new">
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700"><TrendingUp className="w-4 h-4" />记一笔收入</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索备注或项目..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="全部分类" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {Object.entries(INCOME_CATEGORIES).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={memberFilter} onValueChange={(v) => setMemberFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="全部成员" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部成员</SelectItem>
            {teamMembers.map((member) => (<SelectItem key={member.user_id} value={member.user_id}>{member.user?.nickname || member.nickname || '未知'}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3,4,5].map((i) => (<div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />))}</div>
      ) : filteredIncomes.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center"><TrendingUp className="w-8 h-8 text-muted-foreground" /></div>
            <p className="text-muted-foreground mb-4">{incomes.length === 0 ? '暂无收入记录' : '没有找到匹配的收入'}</p>
            {incomes.length === 0 && <Link href="/app/incomes/new"><Button className="bg-green-600 hover:bg-green-700">记一笔收入</Button></Link>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIncomes).map(([month, monthIncomes]) => (
            <div key={month}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{month}</h3>
              <Card><CardContent className="p-0 divide-y divide-border">
                {monthIncomes.map((income) => (
                  <div key={income.id} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => setSelectedIncome(income)}>
                    <Avatar className="w-10 h-10"><AvatarImage src={income.user?.avatar_url || ''} /><AvatarFallback>{income.user?.nickname?.[0] || 'U'}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-green-500 text-green-600">{INCOME_CATEGORIES[income.category as keyof typeof INCOME_CATEGORIES]}</Badge>
                        <span className="text-sm text-muted-foreground">{income.user?.nickname || '未知'}</span>
                        {income.image_url && <ImageIcon className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <p className="text-sm truncate">{income.description || '无备注'}</p>
                      {income.project_name && <p className="text-xs text-muted-foreground truncate">项目：{income.project_name}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-green-600">+¥{Number(income.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(income.date), 'MM/dd')}</p>
                    </div>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedIncome} onOpenChange={() => setSelectedIncome(null)}>
        <DialogContent>
          {selectedIncome && (
            <>
              <DialogHeader><DialogTitle>收入详情</DialogTitle></Dialo
...(truncated)...
