import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isNL = i18n.language === 'nl'

  return (
    <button
      onClick={() => i18n.changeLanguage(isNL ? 'en' : 'nl')}
      className="lang-toggle"
    >
      {isNL ? 'EN' : 'NL'}
    </button>
  )
}
