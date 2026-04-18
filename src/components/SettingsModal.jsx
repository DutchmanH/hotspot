import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Sun, Moon, Globe, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SettingsModal({ theme, onToggleTheme, onClose }) {
  const { t, i18n } = useTranslation()
  const isNL = i18n.language === 'nl'

  const toggleLang = () => {
    const next = isNL ? 'en' : 'nl'
    i18n.changeLanguage(next)
    localStorage.setItem('hotspot_lang', next)
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>{t('settings.title')}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="settings-body">
          <div className="setting-row">
            <div className="setting-label">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{t('settings.theme')}</span>
            </div>
            <button className="setting-toggle" onClick={onToggleTheme}>
              <span className={`toggle-track ${theme === 'dark' ? 'active' : ''}`}>
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">{theme === 'dark' ? t('theme.dark') : t('theme.light')}</span>
            </button>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <Globe size={16} />
              <span>{t('settings.language')}</span>
            </div>
            <button className="setting-toggle" onClick={toggleLang}>
              <span className={`toggle-track ${!isNL ? 'active' : ''}`}>
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">{isNL ? 'NL' : 'EN'}</span>
            </button>
          </div>

          <div className="setting-divider" />

          <Link to="/admin" className="setting-login" onClick={onClose}>
            <LogIn size={16} />
            <span>{t('settings.adminLogin')}</span>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
