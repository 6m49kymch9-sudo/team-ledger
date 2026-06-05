'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EXPENSE_CATEGORIES } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ArrowLeft, Calendar as CalendarIcon, ImageIcon, Loader2 } from 'lucide-react'

export default function NewExpensePage() {
  const { user, team } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: 'other',
    description: '',
    project_name: '',
    image_url: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('请输入有效的金额')
      return
    }

    if (!team) {
      setError('请先加入团队')
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase.from('expenses').insert({
      team_id: team.id,
      user_id: user!.id,
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description || null,
      project_name: formData.project_name || null,
      image_url: formData.image_url || null,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push('/app/expenses')
    }
  }

  if (!team) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
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
    <div className="p-4 lg:p-6 max-w-2xl mx-auto pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/app/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">新增账单</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <Card>
          <CardHeader>
            <CardTitle>金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                ¥
              </span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-10 text-3xl h-14 font-bold border-2 focus:border-primary"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Category */}
        <Card>
          <CardHeader>
            <CardTitle>日期 & 分类</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value || 'other' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Project */}
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">备注</Label>
              <Textarea
                id="description"
                placeholder="描述这笔支出的用途..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">项目（可选）</Label>
              <Input
                id="project"
                placeholder="关联的项目名称"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Image URL */}
        <Card>
          <CardHeader>
            <CardTitle>凭证图片</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">图片链接（可选）</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="凭证预览"
                  className="w-full max-h-48 object-contain rounded-lg bg-secondary"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/app/expenses" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              取消
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存账单'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}