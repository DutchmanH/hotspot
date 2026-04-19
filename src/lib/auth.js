import { supabase } from './supabase'

/* ── Sign up ──────────────────────────────────────────────────── */
export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName || email.split('@')[0] },
    },
  })
  if (error) throw error
  return data
}

/* ── Sign in ──────────────────────────────────────────────────── */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/* ── Google OAuth ─────────────────────────────────────────────── */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
  return data
}

/* ── Sign out ─────────────────────────────────────────────────── */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/* ── Password reset (sends email) ────────────────────────────── */
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}?reset=1`,
  })
  if (error) throw error
}

/* ── Update password (after reset link or from account page) ─── */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/* ── Update email ─────────────────────────────────────────────── */
export async function updateEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

/* ── Update display name ──────────────────────────────────────── */
export async function updateDisplayName(displayName) {
  const { data: { user }, error: authError } = await supabase.auth.updateUser({
    data: { full_name: displayName },
  })
  if (authError) throw authError

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw error
}

/* ── Get profile ──────────────────────────────────────────────── */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/* ── Delete account ───────────────────────────────────────────── */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_user_account')
  if (error) throw error
  await supabase.auth.signOut()
}
