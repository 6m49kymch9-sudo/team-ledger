import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './app/providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0071E3',
}

export const metadata: Metadata = {
  title: 'Team Ledger - 团队记账结算系统',
  description: '让多人团队轻松记录支出，智能AA结算，透明展示财务数据',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}