import type { ParsedRule } from './rule-schema.ts'

export type FormatMode = 'verbose' | 'balanced' | 'concise'

export const FORMAT_MODES: ReadonlyArray<FormatMode> = [
  'verbose',
  'balanced',
  'concise',
]

export const isFormatMode = (value: unknown): value is FormatMode => {
  return FORMAT_MODES.includes(value as FormatMode)
}

type FormatRuleOptions = {
  rule: ParsedRule
  mode: FormatMode
}

export const formatRule = (options: FormatRuleOptions): string => {
  const parts = [options.rule.action, options.rule.target]

  if (options.rule.context) {
    parts.push(options.rule.context)
  }

  const ruleLine = 'Rule: ' + parts.join(' ')
  if (options.mode === 'concise') {
    return ruleLine
  }

  return ruleLine + '\nReason: ' + options.rule.reason
}

type FormatRulesOptions = {
  rules: Array<ParsedRule>
  mode: FormatMode
}

export const formatRules = (options: FormatRulesOptions): string => {
  if (options.rules.length === 0) {
    return ''
  }

  const formatted = options.rules.map((rule) => {
    return formatRule({ rule, mode: options.mode })
  })

  const joiner = options.mode === 'concise' ? '\n' : '\n\n'

  return formatted.join(joiner) + '\n'
}
