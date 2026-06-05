'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Team, TeamMember } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  team: Team | null
  teamMembers: TeamMember[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  signInWithWechat: () => Promise<{ error: string | null }>
  refreshTeam: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTeamMembers = async (teamId: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('*, user:users(*)')
      .eq('team_id', teamId)
    if (data) {
      setTeamMembers(data as unknown as TeamMember[])
    }
  }

  const fetchUserTeam = async (userId: string) => {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (membership) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', membership.team_id)
        .maybeSingle()
      if (teamData) {
        setTeam(teamData as unknown as Team)
        await fetchTeamMembers(teamData.id)
      }
    } else {
      setTeam(null)
      setTeamMembers([])
    }
  }

  const refreshTeam = async () => {
    if (user) {
      await fetchUserTeam(user.id)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        if (userData) {
          setUser(userData as unknown as User)
          await fetchUserTeam(session.user.id)
        }
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          if (userData) {
            setUser(userData as unknown as User)
            await fetchUserTeam(session.user.id)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setTeam(null)
          setTeamMembers([])
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { error: error.message }
    
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()
      if (userData) {
        setUser(userData as unknown as User)
        await fetchUserTeam(data.user.id)
      }
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string, nickname: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) return { error: error.message }
    
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          nickname,
          password_hash: password, // Note: In production, hash this server-side
        })
      if (profileError) return { error: profileError.message }
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()
      if (userData) {
        setUser(userData as unknown as User)
      }
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTeam(null)
    setTeamMembers([])
  }

  const signInWithWechat = async () => {
    // Wechat OAuth - would need to be implemented with actual Wechat Open Platform
    return { error: '微信登录功能待配置' }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        team,
        teamMembers,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithWechat,
        refreshTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}