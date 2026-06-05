'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const handleSaveProfile = async () => {
    setLoading(true)
    // Simulate save
    setTimeout(() => {
      toast.success('设置已保存')
      setLoading(false)
    }, 1000)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground">管理您的个人设置</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.avatar_url || ''} />
                <AvatarFallback className="text-xl">
                  {user?.nickname?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h3 className="font-semibold">{user?.nickname}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                defaultValue={user?.nickname || ''}
                placeholder="您的昵称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                邮箱地址用于登录，如需修改请联系管理员
              </p>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={loading}>
            {loading ? '保存中...' : '保存修改'}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>外观</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>深色模式</Label>
              <p className="text-sm text-muted-foreground">
                切换应用的外观主题
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">版本</span>
            <span>1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">构建时间</span>
            <span>2024-01</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">退出登录</p>
              <p className="text-sm text-muted-foreground">
                退出后需要重新登录才能访问
              </p>
            </div>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}