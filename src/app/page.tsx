import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Receipt,
  PieChart,
  ArrowRightLeft,
  Download,
  Shield,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">TL</span>
            </div>
            <span className="font-semibold text-lg">Team Ledger</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">免费开始</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            多人团队记账从未如此简单
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            团队记账
            <br />
            <span className="gradient-text">智能结算</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            让多人团队轻松记录支出，智能AA结算，透明展示财务数据。
            无需再为分摊吵架，结算一目了然。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 h-12 px-8">
                免费开始
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8">
                已有账号
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            为团队财务管理而生
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="团队协作"
              description="邀请成员加入，共同记录支出，实时同步数据"
            />
            <FeatureCard
              icon={<Receipt className="w-6 h-6" />}
              title="支出记录"
              description="支持图片凭证、分类管理、备注说明"
            />
            <FeatureCard
              icon={<ArrowRightLeft className="w-6 h-6" />}
              title="智能AA结算"
              description="自动计算最优结算路径，最少转账次数"
            />
            <FeatureCard
              icon={<PieChart className="w-6 h-6" />}
              title="数据看板"
              description="饼图、柱状图、趋势图，财务状况一目了然"
            />
            <FeatureCard
              icon={<Download className="w-6 h-6" />}
              title="导出报表"
              description="支持 Excel、PDF、CSV 多格式导出"
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="移动优先"
              description="iOS/Android PWA 应用，随时随地记账"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            简单三步，快速上手
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="创建/加入团队"
              description="创建新团队或输入邀请码加入现有团队"
            />
            <StepCard
              number={2}
              title="记录每笔支出"
              description="随时记录支出，上传凭证，添加备注"
            />
            <StepCard
              number={3}
              title="一键结算"
              description="系统自动计算最优结算方案，一目了然"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            开始管理你的团队财务
          </h2>
          <p className="text-xl opacity-90 mb-10">
            免费注册，立即使用。支持周结、月结多种结算方式。
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2 h-12 px-8">
              免费开始
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TL</span>
              </div>
              <span className="font-semibold">Team Ledger</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Team Ledger. 多团队财务管理的最佳选择。
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
        {number}
      </div>
      <h3 className="font-semibold text-xl mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}