import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isNL = i18n.language === 'nl'

  const toggle = () => {
    const next = isNL ? 'en' : 'nl'
    i18n.changeLanguage(next)
    localStorage.setItem('hotspot_lang', next)
  }

  return (
    <button onClick={toggle} className="lang-toggle">
      {isNL ? 'EN' : 'NL'}
    </button>
  )
}
