// @ts-nocheck
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)  // 'user' | 'admin' | null
  const [loading, setLoading]       = useState(true)
  const [recovering, setRecovering] = useState(false)

  const fetchRole = useCallback(async (userId) => {
    if (!userId) {
      setRole(null)
      return null
    }
    const { data } = await supabase.rpc('get_my_role')
    const nextRole = data ?? 'user'
    setRole(nextRole)
    return nextRole
  }, [])

  const refreshRole = useCallback(async (userId) => {
    return await fetchRole(userId ?? user?.id ?? null)
  }, [fetchRole, user?.id])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      fetchRole(session?.user?.id ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      fetchRole(session?.user?.id ?? null)
      setRecovering(event === 'PASSWORD_RECOVERY')
    })

    return () => subscription.unsubscribe()
  }, [fetchRole])

  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, recovering, refreshRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
