import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { GRADES, PLANS } from '@/config/plans'
import { NAVIGATION } from '@/config/navigation'
import { TRIP_KINDS } from '@/components/driver/trip-names'
import en from './locales/en.json'
import sw from './locales/sw.json'

// Every English sentence the parent, driver and sign-in screens show must
// have a Kiswahili version. The admin screens are English for now.
const SRC = path.resolve(import.meta.dirname, '..')
const TRANSLATED = [
  'pages/parent',
  'pages/driver',
  'pages/auth',
  'components/parent',
  'components/driver',
  'components/auth',
  'components/layout',
  'components/common',
  'components/theme',
]
// Files whose messages are shown through t() somewhere else (FormField,
// toasts, the boarding card…).
const MESSAGE_FILES = [
  'lib/validation/auth-schemas.js',
  'lib/validation/child-schema.js',
  'lib/validation/payment-schema.js',
  'lib/validation/photo.js',
  'services/auth-service.js',
  'services/driver-service.js',
  'components/driver/before-you-start.jsx',
  'components/driver/trip-card.jsx',
  'components/driver/trip-status-chips.jsx',
  'components/parent/fee-text.js',
  'pages/parent/child-form-page.jsx',
]

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name)
    if (statSync(file).isDirectory()) return filesIn(file)
    return /\.(jsx?|js)$/.test(name) && !name.includes('.test.') ? [file] : []
  })
}

const read = (file) => readFileSync(file, 'utf8')
const unescape = (text) => text.replace(/\\'/g, "'").replace(/\\"/g, '"')

// t('…'), t("…") and i18nKey="…"
function keysIn(source) {
  const keys = []
  for (const match of source.matchAll(
    /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g,
  )) {
    keys.push(unescape(match[1] ?? match[2]))
  }
  for (const match of source.matchAll(/i18nKey="([^"]*)"/g)) keys.push(match[1])
  return keys
}

// Sentences in quotes: start with a capital letter and contain a space.
function sentencesIn(source) {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  return [...code.matchAll(/(?<![\w.])'((?:[^'\\]|\\.)*)'|"([^"]*)"/g)]
    .map((match) => unescape(match[1] ?? match[2]))
    .filter((text) => /^[A-Z][^/]*\s/.test(text) && !text.includes('${'))
}

const hasKiswahili = (key) =>
  key in sw || (`${key}_one` in sw && `${key}_other` in sw)

describe('Kiswahili translations', () => {
  it('cover every t() key in the parent, driver and sign-in screens', () => {
    const keys = TRANSLATED.flatMap((dir) =>
      filesIn(path.join(SRC, dir)).flatMap((file) => keysIn(read(file))),
    )
    expect(keys.length).toBeGreaterThan(300)
    expect([...new Set(keys)].filter((key) => !hasKiswahili(key))).toEqual([])
  })

  it('cover the messages shown through t() elsewhere', () => {
    const sentences = MESSAGE_FILES.flatMap((file) =>
      sentencesIn(read(path.join(SRC, file))),
    )
    expect(
      [...new Set(sentences)].filter((text) => !hasKiswahili(text)),
    ).toEqual([])
  })

  it('cover the menus, plans, grades and trip labels', () => {
    const labels = [
      ...['parent', 'driver'].flatMap((role) => [
        NAVIGATION[role].label,
        ...NAVIGATION[role].sections.flatMap((section) => [
          section.title,
          ...section.items.map((item) => item.label),
        ]),
      ]),
      ...Object.values(PLANS).flatMap((plan) => [plan.label, plan.description]),
      ...GRADES,
      ...Object.values(TRIP_KINDS).flatMap((kind) => [
        kind.lastStop,
        kind.markLabel,
      ]),
    ]
    expect(labels.filter((label) => !hasKiswahili(label))).toEqual([])
  })

  it('keep the same {{placeholders}} as the English', () => {
    // A singular may say "one" instead of {{count}}, so count is left out.
    const names = (text) =>
      (text.match(/{{\w+}}/g) ?? [])
        .filter((name) => name !== '{{count}}')
        .toSorted()
        .join()
    const mismatched = Object.entries(sw).filter(([key, text]) => {
      const english = en[key] ?? key.replace(/_(one|other)$/, '')
      return names(text) !== names(english)
    })
    expect(mismatched).toEqual([])
  })
})
