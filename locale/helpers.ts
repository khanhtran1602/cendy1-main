import {
    AppLanguage,
    type Language,
    LANGUAGES_MAP_CODE2,
    LANGUAGES_MAP_CODE3,
} from './languages'

export function code2ToCode3(lang: string): string {
  if (lang.length === 2) {
    return LANGUAGES_MAP_CODE2[lang]?.code3 || lang
  }
  return lang
}

export function code3ToCode2(lang: string): string {
  if (lang.length === 3) {
    return LANGUAGES_MAP_CODE3[lang]?.code2 || lang
  }
  return lang
}

export function code3ToCode2Strict(lang: string): string | undefined {
  if (lang.length === 3) {
    return LANGUAGES_MAP_CODE3[lang]?.code2
  }

  return undefined
}

function getLocalizedLanguage(
  langCode: string,
  appLang: string,
): string | undefined {
  try {
    const allNames = new Intl.DisplayNames([appLang], {
      type: 'language',
      fallback: 'none',
      languageDisplay: 'standard',
    })
    const translatedName = allNames.of(langCode)

    if (translatedName) {
      return translatedName
    }
  } catch (e) {
    // ignore RangeError from Intl.DisplayNames APIs
    if (!(e instanceof RangeError)) {
      throw e
    }
  }
}

export function languageName(language: Language, appLang: string): string {
  // if Intl.DisplayNames is unavailable on the target, display the English name
  if (!(Intl as any).DisplayNames) {
    return language.name
  }

  return getLocalizedLanguage(language.code2, appLang) || language.name
}

export function codeToLanguageName(lang2or3: string, appLang: string): string {
  const code2 = code3ToCode2(lang2or3)
  const knownLanguage = LANGUAGES_MAP_CODE2[code2]

  return knownLanguage ? languageName(knownLanguage, appLang) : code2
}

export function getTranslatorLink(text: string, lang: string): string {
  return `https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(
    text,
  )}`
}

/**
 * Returns a valid `appLanguage` value from an arbitrary string.
 *
 * Context: post-refactor, we populated some user's `appLanguage` setting with
 * `postLanguage`, which can be a comma-separated list of values. This breaks
 * `appLanguage` handling in the app, so we introduced this util to parse out a
 * valid `appLanguage` from the pre-populated `postLanguage` values.
 *
 * The `appLanguage` will continue to be incorrect until the user returns to
 * language settings and selects a new option, at which point we'll re-save
 * their choice, which should then be a valid option. Since we don't know when
 * this will happen, we should leave this here until we feel it's safe to
 * remove, or we re-migrate their storage.
 */
export function sanitizeAppLanguageSetting(appLanguage: string): AppLanguage {
  const langs = appLanguage.split(',').filter(Boolean)

  for (const lang of langs) {
    switch (fixLegacyLanguageCode(lang)) {
      case 'en':
        return AppLanguage.en
      case 'vi':
        return AppLanguage.vi
      default:
        continue
    }
  }
  return AppLanguage.en
}

/**
 * Handles legacy migration for Java devices.
 *
 * {@link https://github.com/bluesky-social/social-app/pull/4461}
 * {@link https://xml.coverpages.org/iso639a.html}
 */
export function fixLegacyLanguageCode(code: string | null): string | null {
  if (code === 'in') {
    // indonesian
    return 'id'
  }
  if (code === 'iw') {
    // hebrew
    return 'he'
  }
  if (code === 'ji') {
    // yiddish
    return 'yi'
  }
  return code
}

/**
 * Find the first language supported by our translation infra. Values should be
 * in order of preference, and match the values of {@link AppLanguage}.
 *
 * If no match, returns `en`.
 */
export function findSupportedAppLanguage(languageTags: (string | undefined)[]) {
  const supported = new Set(Object.values(AppLanguage))
  for (const tag of languageTags) {
    if (!tag) continue
    if (supported.has(tag as AppLanguage)) {
      return tag
    }
  }
  return AppLanguage.en
}