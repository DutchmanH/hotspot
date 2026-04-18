import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, LogOut } from 'lucide-react'

export default function Admin() {
  const { t } = useTranslation()
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadStats()
    })
  }, [])

  const loadStats = async () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [{ count: total }, { count: week }, { data: cats }] = await Promise.all([
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true })
        .gte('started_at', oneWeekAgo.toISOString()),
      supabase.from('searches').select('category'),
    ])

    const catCounts = {}
    cats?.forEach(({ category }) => {
      catCounts[category] = (catCounts[category] || 0) + 1
    })
    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    setStats({ total, week, topCats })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError(error.message)
    } else {
      setSession(data.session)
      loadStats()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setStats(null)
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Hotspot</Link>
        <h1>{t('admin.title')}</h1>
        {session && (
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /> {t('admin.logout')}
          </button>
        )}
      </header>

      {!session ? (
        <form onSubmit={handleLogin} className="login-form">
          <h2>{t('admin.login')}</h2>
          {loginError && <p className="error">{loginError}</p>}
          <label>
            {t('admin.email')}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            {t('admin.password')}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <button type="submit">{t('admin.login')}</button>
        </form>
      ) : (
        <div className="admin-dashboard">
          {stats ? (
            <>
              <div className="stat-cards">
                <div className="stat-card">
                  <span className="stat-value">{stats.total ?? 0}</span>
                  <span className="stat-label">{t('admin.stats.totalSessions')}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.week ?? 0}</span>
                  <span className="stat-label">{t('admin.stats.weekSessions')}</span>
                </div>
              </div>
              <div className="top-cats">
                <h3>{t('admin.stats.topCategories')}</h3>
                {stats.topCats.length === 0 ? (
                  <p>Geen data</p>
                ) : (
                  <ul>
                    {stats.topCats.map(([cat, count]) => (
                      <li key={cat}><strong>{cat}</strong>: {count}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p>Laden...</p>
          )}
        </div>
      )}
    </div>
  )
}
