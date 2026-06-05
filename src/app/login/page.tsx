'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, MessageCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [mode, setMode] = useState<'select' | 'email' | 'wechat'>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn, signInWithWechat } = useAuth()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      router.push('/app')
    }
  }

  const handleWechatLogin = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithWechat()
    if (error) {
      setError(error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {mode === 'select' && (
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">登录 Team Ledger</CardTitle>
                <CardDescription>
                  选择登录方式开始管理团队财务
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2"
                  onClick={() => setMode('email')}
                >
                  <Mail className="w-5 h-5" />
                  邮箱登录
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2"
                  onClick={handleWechatLogin}
                >
                  <MessageCircle className="w-5 h-5" />
                  微信登录
                </Button>
                <div className="pt-4 text-center text-sm text-muted-foreground">
                  还没有账号？{' '}
                  <Link href="/register" className="text-primary hover:underline">
                    立即注册
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'email' && (
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">邮箱登录</CardTitle>
                <CardDescription>
                  输入您的邮箱和密码登录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full h-12" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      '登录'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode('select')}
                  >
                    返回选择
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}