'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Expense, EXPENSE_CATEGORIES } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'
import { Download, FileSpreadsheet, FileText, File, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ExportFormat = 'xlsx' | 'pdf' | 'csv'

export default function ExportPage() {
  const { user, team, teamMembers } = useAuth()
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<ExportFormat>('xlsx')
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [exportContent, setExportContent] = useState({
    expenses: true,
    categorySummary: true,
    memberSummary: true,
  })
  const [previewData, setPreviewData] = useState<Expense[]>([])

  const fetchPreviewData = async () => {
    if (!team) return

    const { data } = await supabase
      .from('expenses')
      .select('*, user:users(*)')
      .eq('team_id', team.id)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: false })

    if (data) {
      setPreviewData(data as unknown as Expense[])
    }
  }

  const handleExport = async () => {
    if (!team) return
    setLoading(true)
    toast.success('正在生成导出文件...')

    // Simulate export (in production, this would call a server-side export API)
    setTimeout(() => {
      setLoading(false)
      toast.success(`${exportType.toUpperCase()} 导出文件已生成`)
    }, 1500)
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
      <div>
        <h1 className="text-2xl font-bold">导出中心</h1>
        <p className="text-muted-foreground">导出账单数据为 Excel、PDF、CSV 格式</p>
      </div>

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>选择导出格式</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={exportType}
            onValueChange={(v) => setExportType(v as ExportFormat)}
            className="grid grid-cols-3 gap-4"
          >
            <Label
              htmlFor="xlsx"
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                exportType === 'xlsx'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="xlsx" id="xlsx" className="sr-only" />
              <FileSpreadsheet className="w-10 h-10 mb-2 text-green-500" />
              <span className="font-medium">Excel</span>
              <span className="text-xs text-muted-foreground">.xlsx</span>
            </Label>
            <Label
              htmlFor="pdf"
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                exportType === 'pdf'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
              <FileText className="w-10 h-10 mb-2 text-red-500" />
              <span className="font-medium">PDF</span>
              <span className="text-xs text-muted-foreground">.pdf</span>
            </Label>
            <Label
              htmlFor="csv"
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                exportType === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="csv" id="csv" className="sr-only" />
              <File className="w-10 h-10 mb-2 text-blue-500" />
              <span className="font-medium">CSV</span>
              <span className="text-xs text-muted-foreground">.csv</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>选择时间范围</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                  end: format(new Date(), 'yyyy-MM-dd'),
                })
              }
            >
              最近7天
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                  end: format(new Date(), 'yyyy-MM-dd'),
                })
              }
            >
              最近30天
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
                  end: format(new Date(), 'yyyy-MM-dd'),
                })
              }
            >
              最近90天
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Selection */}
      <Card>
        <CardHeader>
          <CardTitle>选择导出内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="expenses"
              checked={exportContent.expenses}
              onCheckedChange={(checked) =>
                setExportContent({ ...exportContent, expenses: !!checked })
              }
            />
            <Label htmlFor="expenses" className="flex-1">
              <span className="font-medium">账单明细</span>
              <p className="text-sm text-muted-foreground">
                包含所有账单的时间、金额、分类、备注
              </p>
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="categorySummary"
              checked={exportContent.categorySummary}
              onCheckedChange={(checked) =>
                setExportContent({ ...exportContent, categorySummary: !!checked })
              }
            />
            <Label htmlFor="categorySummary" className="flex-1">
              <span className="font-medium">分类汇总</span>
              <p className="text-sm text-muted-foreground">
                按分类统计支出金额和笔数
              </p>
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="memberSummary"
              checked={exportContent.memberSummary}
              onCheckedChange={(checked) =>
                setExportContent({ ...exportContent, memberSummary: !!checked })
              }
            />
            <Label htmlFor="memberSummary" className="flex-1">
              <span className="font-medium">成员统计</span>
              <p className="text-sm text-muted-foreground">
                按成员统计支出金额和笔数
              </p>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>预览</CardTitle>
            <CardDescription>共 {previewData.length} 笔账单</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPreviewData}>
            刷新预览
          </Button>
        </CardHeader>
        <CardContent>
          {previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">日期</th>
                    <th className="text-left p-2">成员</th>
                    <th className="text-left p-2">分类</th>
                    <th className="text-left p-2">备注</th>
                    <th className="text-right p-2">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 5).map((expense) => (
                    <tr key={expense.id} className="border-b">
                      <td className="p-2">{expense.date}</td>
                      <td className="p-2">{expense.user?.nickname || '未知'}</td>
                      <td className="p-2">
                        {EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]}
                      </td>
                      <td className="p-2 truncate max-w-32">
                        {expense.description || '-'}
                      </td>
                      <td className="p-2 text-right">
                        ¥{Number(expense.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 5 && (
                <p className="text-center text-muted-foreground py-2">
                  还有 {previewData.length - 5} 笔账单...
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              暂无数据，请选择日期范围后刷新预览
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleExport}
        disabled={loading || previewData.length === 0}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            导出 {exportType.toUpperCase()}
          </>
        )}
      </Button>
    </div>
  )
}