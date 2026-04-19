// @ts-nocheck
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)  // 'user' | 'admin' | null
  const [loading, setLoading]       = useState(true)
  const [recovering, setRecovering] = useState(false)

  async function fetchRole(userId) {
    if (!userId) { setRole(null); return }
    const { data } = await supabase.rpc('get_my_role')
    setRole(data ?? 'user')
  }

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
  }, [])

  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, recovering }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
