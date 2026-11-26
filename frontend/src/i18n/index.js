import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

// Fika speaks English and Kiswahili. The English sentence is the key
// (t('Track the bus')), so components read naturally and English needs no
// file except for plurals. locales/sw.json holds the Kiswahili for every
// key; it is downloaded only when someone chooses Kiswahili. A test
// (i18n.test.js) fails if a t('…') in the parent, driver or sign-in screens
// has no Kiswahili.
// The admin screens stay in English for now; AppLayout keeps them so.

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'sw', label: 'Kiswahili', short: 'SW' },
]
const CODES = LANGUAGES.map((language) => language.code)
const STORAGE_KEY = 'fika-language'

// The person's choice on this device, else their phone's language, else
// English. (The back end will keep it on their account, so notifications
// and SMS use it too.)
export function savedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (CODES.includes(saved)) return saved
  } catch {
    // Storage can be blocked; fall through to the phone's language.
  }
  const phone = navigator.languages ?? [navigator.language]
  return phone.some((code) => code?.toLowerCase().startsWith('sw'))
    ? 'sw'
    : 'en'
}

export function chooseLanguage(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // The choice still applies until the page is reloaded.
  }
  return i18n.changeLanguage(code)
}

i18n
  .use(
    resourcesToBackend((language) =>
      language === 'sw' ? import('./locales/sw.json') : Promise.resolve({}),
    ),
  )
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    partialBundledLanguages: true,
    lng: savedLanguage(),
    fallbackLng: 'en',
    supportedLngs: CODES,
    // Keys are English sentences, which contain '.' and ':'.
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false }, // React escapes already
    react: { useSuspense: false },
  })

function setPageLanguage(code) {
  document.documentElement.lang = code
}
setPageLanguage(i18n.language)
i18n.on('languageChanged', setPageLanguage)

export default i18n
