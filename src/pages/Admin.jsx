import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, LogOut, Globe, Monitor } from 'lucide-react'

function formatDayKey(date) {
  return date.toISOString().slice(0, 10)
}

function buildDailySeries(sessions, days = 14) {
  const now = new Date()
  const dayBuckets = []
  const counts = {}

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = formatDayKey(d)
    counts[key] = 0
    dayBuckets.push({
      key,
      label: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
      count: 0,
    })
  }

  sessions.forEach((s) => {
    if (!s?.started_at) return
    const key = formatDayKey(new Date(s.started_at))
    if (key in counts) counts[key] += 1
  })

  return dayBuckets.map((d) => ({ ...d, count: counts[d.key] }))
}

function buildDailyUniqueSeries(sessions, days = 14) {
  const now = new Date()
  const dayBuckets = []
  const uniqueByDay = {}

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = formatDayKey(d)
    uniqueByDay[key] = new Set()
    dayBuckets.push({
      key,
      label: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
      count: 0,
    })
  }

  sessions.forEach((s) => {
    if (!s?.started_at || !s?.session_id) return
    const key = formatDayKey(new Date(s.started_at))
    if (uniqueByDay[key]) uniqueByDay[key].add(s.session_id)
  })

  return dayBuckets.map((d) => ({ ...d, count: uniqueByDay[d.key].size }))
}

function isMissingColumnPostgrestError(error) {
  if (!error) return false
  const code = String(error.code || '')
  if (code === '42703' || code === 'PGRST204') return true

  const msg = String(error.message || '').toLowerCase()
  if (!msg.includes('column')) return false
  return msg.includes('does not exist') || msg.includes('could not find')
}

async function loadProfilesUsersTable(supabaseClient) {
  const tries = [
    'id, display_name, role, email, created_at, updated_at',
    'id, display_name, role, created_at, updated_at',
    'id, display_name, email, created_at, updated_at',
    'id, display_name, created_at, updated_at',
    'id, display_name',
  ]

  let lastError = null

  for (const sel of tries) {
    const ordered = await supabaseClient
      .from('profiles')
      .select(sel)
      .order('created_at', { ascending: false })
      .limit(300)

    if (!ordered.error) return { data: ordered.data || [], error: null }

    lastError = ordered.error
    if (!isMissingColumnPostgrestError(ordered.error)) {
      return { data: [], error: ordered.error }
    }

    const unordered = await supabaseClient.from('profiles').select(sel).limit(300)
    if (!unordered.error) {
      const rows = [...(unordered.data || [])].sort((a, b) => {
        const ta = a?.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b?.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      return { data: rows.slice(0, 300), error: null }
    }

    lastError = unordered.error
    if (!isMissingColumnPostgrestError(unordered.error)) {
      return { data: [], error: unordered.error }
    }
  }

  return { data: [], error: lastError }
}

export default function Admin() {
  const { t } = useTranslation()
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(null)
  const [users, setUsers] = useState([])
  const [usersError, setUsersError] = useState(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('live') // 'all' | 'live' | 'dev'
  const [chartMode, setChartMode] = useState('sessions') // 'sessions' | 'users'

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const loadStats = async (filter = sourceFilter) => {
    setStatsError(null)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    try {
      const [
        { data: sessionsData, error: e1 },
        { data: searchesData, error: e2 },
      ] = await Promise.all([
        supabase
          .from('sessions')
          .select('session_id, started_at, source')
          .order('started_at', { ascending: false })
          .limit(5000),
        supabase.from('searches').select('session_id, category').limit(10000),
      ])

      const err = e1 || e2
      if (err) { setStatsError(err.message); return }

      const sessions = sessionsData || []
      const searches = searchesData || []

      const filteredSessions = sessions.filter((s) => {
        if (filter === 'live') return s.source !== 'localhost'
        if (filter === 'dev') return s.source === 'localhost'
        return true
      })

      const sessionIds = new Set(filteredSessions.map((s) => s.session_id))
      const uniqueUsers = sessionIds.size
      const filteredSearches = searches.filter((s) => sessionIds.has(s.session_id))
      const week = filteredSessions.filter((s) => new Date(s.started_at) >= oneWeekAgo).length

      const catCounts = {}
      filteredSearches.forEach(({ category }) => {
        catCounts[category] = (catCounts[category] || 0) + 1
      })
      const topCats = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)

      const dailySeries = buildDailySeries(filteredSessions, 14)
      const dailyUniqueSeries = buildDailyUniqueSeries(filteredSessions, 14)

      setStats({
        total: filteredSessions.length,
        uniqueUsers,
        week: week ?? 0,
        topCats,
        dailySeries,
        dailyUniqueSeries,
      })
    } catch (err) {
      setStatsError(String(err))
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const { data, error } = await loadProfilesUsersTable(supabase)
      if (error) {
        setUsersError(error.message)
        setUsers([])
        return
      }
      setUsers(data || [])
    } catch (err) {
      setUsersError(String(err))
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        loadStats('live')
        loadUsers()
      }
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
      loadUsers()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setStats(null)
    setUsers([])
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
                  <span className="stat-value">{stats.uniqueUsers}</span>
                  <span className="stat-label">{t('admin.stats.uniqueUsers')}</span>
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
              <div className="daily-chart-card">
                <div className="daily-chart-head">
                  <h3>{chartMode === 'sessions' ? t('admin.stats.dailySessions') : t('admin.stats.dailyUniqueUsers')}</h3>
                  <div className="admin-chart-toggle">
                    <button
                      className={`source-btn ${chartMode === 'sessions' ? 'active' : ''}`}
                      onClick={() => setChartMode('sessions')}
                    >
                      {t('admin.stats.chartSessions')}
                    </button>
                    <button
                      className={`source-btn ${chartMode === 'users' ? 'active' : ''}`}
                      onClick={() => setChartMode('users')}
                    >
                      {t('admin.stats.chartUsers')}
                    </button>
                  </div>
                </div>
                <div className="daily-chart">
                  {(chartMode === 'sessions' ? stats.dailySeries : stats.dailyUniqueSeries)?.map((day) => {
                    const activeSeries = chartMode === 'sessions' ? stats.dailySeries : stats.dailyUniqueSeries
                    const maxCount = Math.max(...activeSeries.map((d) => d.count), 1)
                    return (
                    <div key={day.key} className="daily-bar-wrap" title={`${day.key}: ${day.count}`}>
                      <div
                        className="daily-bar"
                        style={{
                          height: `${Math.max(6, (day.count / maxCount) * 100)}%`,
                        }}
                      />
                      <span className="daily-bar-label">{day.label}</span>
                      <span className="daily-bar-value">{day.count}</span>
                    </div>
                    )
                  })}
                </div>
              </div>
              <div className="admin-users-card">
                <div className="admin-users-head">
                  <h3>{t('admin.users.title')}</h3>
                  <button className="source-btn" onClick={loadUsers}>
                    {t('admin.users.refresh')}
                  </button>
                </div>
                {usersError && (
                  <div className="admin-error">
                    <strong>Fout bij laden:</strong> {usersError}
                  </div>
                )}
                {usersLoading ? (
                  <p className="admin-loading">{t('admin.users.loading')}</p>
                ) : users.length === 0 ? (
                  <p className="admin-empty">{t('admin.users.empty')}</p>
                ) : (
                  <div className="admin-users-table-wrap">
                    <table className="admin-users-table">
                      <thead>
                        <tr>
                          <th>{t('admin.users.name')}</th>
                          <th>{t('admin.users.role')}</th>
                          <th>{t('admin.users.identifier')}</th>
                          <th>{t('admin.users.created')}</th>
                          <th>{t('admin.users.updated')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.display_name || '—'}</td>
                            <td>{u.role || '—'}</td>
                            <td>
                              {u.email
                                ? u.email
                                : u.id
                                  ? `${String(u.id).slice(0, 8)}…`
                                  : '—'}
                            </td>
                            <td>{formatDate(u.created_at)}</td>
                            <td>{formatDate(u.updated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
