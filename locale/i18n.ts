// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-numberformat/polyfill-force'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/polyfill-force'

import { i18n } from '@lingui/core'
import { useEffect } from 'react'

import { messages as messagesEn } from '@/locale/locales/en/messages.po'
import { messages as messagesVi } from '@/locale/locales/vi/messages.po'
import { useLanguagePrefs } from '@/state/preferences'
import { sanitizeAppLanguageSetting } from './helpers'
import { AppLanguage } from './languages'

export async function dynamicActivate(locale: AppLanguage) {
  switch (locale) {
    case AppLanguage.vi: {
      i18n.loadAndActivate({ locale, messages: messagesVi })
      await Promise.all([
        import('@formatjs/intl-pluralrules/locale-data/vi'),
        import('@formatjs/intl-numberformat/locale-data/vi'),
      ])
      break
    }
    case AppLanguage.en:
    default: {
      i18n.loadAndActivate({ locale, messages: messagesEn })
      break
    }
  }
}

export function useLocaleLanguage() {
  const { appLanguage } = useLanguagePrefs()
  useEffect(() => {
    dynamicActivate(sanitizeAppLanguageSetting(appLanguage))
  }, [appLanguage])
}
