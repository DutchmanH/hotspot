import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import nl from './nl.json'
import en from './en.json'

i18n.use(initReactI18next).init({
  resources: {
    nl: { translation: nl },
    en: { translation: en },
  },
  lng: localStorage.getItem('hotspot_lang') || 'nl',
  fallbackLng: 'nl',
  interpolation: { escapeValue: false },
})

export default i18n
