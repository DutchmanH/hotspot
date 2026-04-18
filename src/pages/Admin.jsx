import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, LogOut, Globe, Monitor } from 'lucide-react'

export default function Admin() {
  const { t } = useTranslation()
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(null)
  const [sourceFilter, setSourceFilter] = useState('live') // 'all' | 'live' | 'dev'

  const loadStats = async (filter = sourceFilter) => {
    setStatsError(null)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    try {
      // Build base queries with optional source filter
      let sessionsQuery = supabase.from('sessions').select('*', { count: 'exact', head: true })
      let sessionsWeekQuery = supabase.from('sessions').select('*', { count: 'exact', head: true })
        .gte('started_at', oneWeekAgo.toISOString())
      let searchesQuery = supabase.from('searches').select('category')

      if (filter === 'live') {
        sessionsQuery = sessionsQuery.not('source', 'eq', 'localhost')
        sessionsWeekQuery = sessionsWeekQuery.not('source', 'eq', 'localhost')
        searchesQuery = searchesQuery.not('session_id', 'in',
          `(select session_id from sessions where source = 'localhost')`
        )
      } else if (filter === 'dev') {
        sessionsQuery = sessionsQuery.eq('source', 'localhost')
        sessionsWeekQuery = sessionsWeekQuery.eq('source', 'localhost')
      }

      const [
        { count: total, error: e1 },
        { count: week, error: e2 },
        { data: cats, error: e3 },
      ] = await Promise.all([sessionsQuery, sessionsWeekQuery, searchesQuery])

      const err = e1 || e2 || e3
      if (err) { setStatsError(err.message); return }

      const catCounts = {}
      cats?.forEach(({ category }) => {
        catCounts[category] = (catCounts[category] || 0) + 1
      })
      const topCats = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)

      setStats({ total: total ?? 0, week: week ?? 0, topCats })
    } catch (err) {
      setStatsError(String(err))
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadStats('live')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError(error.message)
    } else {
      setSession(data.session)
      loadStats('live')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setStats(null)
  }

  const handleSourceFilter = (f) => {
    setSourceFilter(f)
    setStats(null)
    loadStats(f)
  }

  const CAT_LABELS = {
    food: '🍷 Eten & Drinken',
    outdoor: '🌿 Buiten',
    culture: '🎭 Cultuur',
    activities: '⚡ Activiteiten',
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

          {/* Source filter */}
          <div className="admin-source-filter">
            <button
              className={`source-btn ${sourceFilter === 'live' ? 'active' : ''}`}
              onClick={() => handleSourceFilter('live')}
            >
              <Globe size={14} /> Live
            </button>
            <button
              className={`source-btn ${sourceFilter === 'dev' ? 'active' : ''}`}
              onClick={() => handleSourceFilter('dev')}
            >
              <Monitor size={14} /> Localhost
            </button>
            <button
              className={`source-btn ${sourceFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleSourceFilter('all')}
            >
              Alles
            </button>
          </div>

          {statsError && (
            <div className="admin-error">
              <strong>Fout bij laden:</strong> {statsError}
            </div>
          )}

          {!stats && !statsError ? (
            <p className="admin-loading">Laden...</p>
          ) : stats ? (
            <>
              <div className="stat-cards">
                <div className="stat-card">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">{t('admin.stats.totalSessions')}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.week}</span>
                  <span className="stat-label">{t('admin.stats.weekSessions')}</span>
                </div>
              </div>
              <div className="top-cats">
                <h3>{t('admin.stats.topCategories')}</h3>
                {stats.topCats.length === 0 ? (
                  <p className="admin-empty">Nog geen zoekopdrachten.</p>
                ) : (
                  <ul>
                    {stats.topCats.map(([cat, count]) => (
                      <li key={cat}>
                        <span>{CAT_LABELS[cat] || cat}</span>
                        <strong>{count}×</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
