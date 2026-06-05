'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Team, MemberRole } from '@/lib/types'
import {
  Users,
  Copy,
  RefreshCw,
  Plus,
  Crown,
  Shield,
  User,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TeamPage() {
  const { user, team, teamMembers, refreshTeam } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  })

  const [joinCode, setJoinCode] = useState('')

  const isOwner = team?.owner_id === user?.id
  const isAdmin = teamMembers.find((m) => m.user_id === user?.id)?.role !== 'member'

  const handleCreateTeam = async () => {
    if (!createForm.name.trim()) return
    setLoading(true)

    const inviteCode = generateInviteCode()

    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        name: createForm.name,
        description: createForm.description || null,
        invite_code: inviteCode,
        owner_id: user!.id,
      })
      .select()
      .single()

    if (error) {
      toast.error('创建失败: ' + error.message)
      setLoading(false)
      return
    }

    await supabase.from('team_members').insert({
      team_id: (newTeam as unknown as Team).id,
      user_id: user!.id,
      role: 'owner',
    })

    await refreshTeam()
    setShowCreateModal(false)
    setCreateForm({ name: '', description: '' })
    toast.success('团队创建成功！')
    setLoading(false)
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return
    setLoading(true)

    const { data: targetTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .single()

    if (!targetTeam) {
      toast.error('邀请码无效')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', targetTeam.id)
      .eq('user_id', user!.id)
      .maybeSingle()

    if (existing) {
      toast.error('您已经是该团队成员')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('team_members').insert({
      team_id: targetTeam.id,
      user_id: user!.id,
      role: 'member',
    })

    if (error) {
      toast.error('加入失败: ' + error.message)
    } else {
      await refreshTeam()
      setShowJoinModal(false)
      setJoinCode('')
      toast.success('成功加入团队！')
    }
    setLoading(false)
  }

  const handleCopyInviteCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.invite_code)
      toast.success('邀请码已复制')
    }
  }

  const handleResetInviteCode = async () => {
    if (!team) return
    const newCode = generateInviteCode()

    await supabase
      .from('teams')
      .update({ invite_code: newCode })
      .eq('id', team.id)

    await refreshTeam()
    toast.success('邀请码已重置')
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return

    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', memberId)

    await refreshTeam()
    setMemberToDelete(null)
    toast.success('已移除成员')
  }

  const handleLeaveTeam = async () => {
    if (!team) return

    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', user!.id)

    await refreshTeam()
    toast.success('已离开团队')
  }

  const getRoleBadge = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
            <Crown className="w-3 h-3" />
            创建者
          </Badge>
        )
      case 'admin':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
            <Shield className="w-3 h-3" />
            管理员
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <User className="w-3 h-3" />
            成员
          </Badge>
        )
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">团队管理</h1>
          <p className="text-muted-foreground">管理您的团队设置和成员</p>
        </div>
        {team && isAdmin && (
          <Button size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
            <Plus className="w-4 h-4" />
            邀请成员
          </Button>
        )}
      </div>

      {/* No Team */}
      {!team && (
        <div className="grid gap-4">
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">加入或创建团队</h2>
              <p className="text-muted-foreground mb-6">
                还没有团队？创建一个新团队或使用邀请码加入现有团队
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4" />
                  创建团队
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => setShowJoinModal(true)}>
                  <Users className="w-4 h-4" />
                  加入团队
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>创建新团队</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>团队名称</Label>
                <Input
                  placeholder="技术部"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>团队描述（可选）</Label>
                <Textarea
                  placeholder="团队简要描述..."
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateTeam}
                  disabled={loading || !createForm.name.trim()}
                >
                  {loading ? '创建中...' : '创建团队'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>加入团队</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowJoinModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>邀请码</Label>
                <Input
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl font-bold tracking-widest"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowJoinModal(false)}>
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleJoinTeam}
                  disabled={loading || !joinCode.trim()}
                >
                  {loading ? '加入中...' : '加入团队'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && team && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>邀请新成员</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-center py-4">
              <p className="text-muted-foreground mb-4">分享邀请码给团队成员</p>
              <div className="p-6 bg-secondary rounded-lg">
                <p className="text-4xl font-bold tracking-widest">{team.invite_code}</p>
              </div>
              <Button variant="outline" className="mt-4 gap-2" onClick={handleCopyInviteCode}>
                <Copy className="w-4 h-4" />
                复制邀请码
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Has Team */}
      {team && (
        <>
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle>团队信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {team.name?.[0] || 'T'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-muted-foreground">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <Label className="text-muted-foreground">邀请码</Label>
                  <p className="text-2xl font-bold tracking-widest">
                    {team.invite_code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyInviteCode}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </Button>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetInviteCode}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重置
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>成员列表</CardTitle>
                <CardDescription>共 {teamMembers.length} 名成员</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.user?.nickname?.[0] || member.nickname?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.user?.nickname || member.nickname || '未知'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        加入于 {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                      {member.user_id !== user?.id && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setMemberToDelete(member.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delete Member Dialog */}
          {memberToDelete && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>移除成员</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    确定要移除此成员吗？此操作无法撤销。
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setMemberToDelete(null)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => memberToDelete && handleRemoveMember(memberToDelete)}
                    >
                      确认移除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leave Team */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">危险区域</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">离开团队</p>
                  <p className="text-sm text-muted-foreground">
                    您将不再能够访问此团队的数据
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={handleLeaveTeam}
                >
                  离开团队
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}