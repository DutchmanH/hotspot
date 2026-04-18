import { Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ThemeToggle({ theme, onToggle }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      title={theme === 'light' ? t('theme.dark') : t('theme.light')}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
