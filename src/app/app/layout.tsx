'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Receipt,
  ArrowRightLeft,
  Users,
  Download,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { href: '/app', label: '数据看板', icon: LayoutDashboard },
  { href: '/app/expenses', label: '账单列表', icon: Receipt },
  { href: '/app/settle', label: '结算中心', icon: ArrowRightLeft },
  { href: '/app/team', label: '团队管理', icon: Users },
  { href: '/app/export', label: '导出中心', icon: Download },
]

const bottomNavItems = [
  { href: '/app/settings', label: '设置', icon: Settings },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, team, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:flex-col lg:w-60 lg:border-r lg:border-border lg:bg-card">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">TL</span>
          </div>
          <span className="font-semibold text-lg">Team Ledger</span>
        </div>

        {/* Team Info */}
        {team && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">当前团队</p>
            <p className="font-medium truncate">{team.name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = typeof window !== 'undefined' && (window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-border">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback>{user.nickname?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.nickname}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">TL</span>
          </div>
          <span className="font-semibold text-lg">Team Ledger</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push('/app/team')}>
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="lg:pl-60 pt-16 lg:pt-0 min-h-screen">
        <div className="h-[calc(100vh-4rem)] lg:h-screen overflow-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-safe">
        <div className="h-16 flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = typeof window !== 'undefined' && (window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}