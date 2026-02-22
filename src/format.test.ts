import { describe, expect, it } from 'bun:test'
import { FORMAT_MODES, formatRule, formatRules, isFormatMode } from './format.ts'
import type { ParsedRule } from './rule-schema.ts'

const RULE_A: ParsedRule = {
  strength: 'obligatory',
  action: 'Use consistent whitespace for readability.',
  target: 'all source files',
  reason: 'Whitespace is critical for readability.',
}

const RULE_B: ParsedRule = {
  strength: 'forbidden',
  action: 'Avoid non-null assertions.',
  target: 'all TypeScript files',
  context: 'when accessing optional values',
  reason: 'Use narrowing type guards instead.',
}

describe('isFormatMode', () => {
  it('returns true for valid modes', () => {
    expect(isFormatMode('verbose')).toBe(true)
    expect(isFormatMode('balanced')).toBe(true)
    expect(isFormatMode('concise')).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isFormatMode('invalid')).toBe(false)
    expect(isFormatMode('')).toBe(false)
    expect(isFormatMode(42)).toBe(false)
    expect(isFormatMode(null)).toBe(false)
  })
})

describe('FORMAT_MODES', () => {
  it('contains all three modes', () => {
    expect(FORMAT_MODES).toEqual(['verbose', 'balanced', 'concise'])
  })
})

describe('formatRule', () => {
  it('formats rule with action, target, and reason in balanced mode', () => {
    const result = formatRule({ rule: RULE_A, mode: 'balanced' })
    expect(result).toBe(
      'Rule: Use consistent whitespace for readability. all source files\n'
        + 'Reason: Whitespace is critical for readability.',
    )
  })

  it('includes context when present', () => {
    const result = formatRule({ rule: RULE_B, mode: 'balanced' })
    expect(result).toContain('when accessing optional values')
  })

  it('omits reason in concise mode', () => {
    const result = formatRule({ rule: RULE_A, mode: 'concise' })
    expect(result).toBe(
      'Rule: Use consistent whitespace for readability. all source files',
    )
    expect(result).not.toContain('Reason:')
  })

  it('includes reason in verbose mode', () => {
    const result = formatRule({ rule: RULE_A, mode: 'verbose' })
    expect(result).toContain('Reason:')
  })
})

describe('formatRules', () => {
  it('returns empty string for empty array', () => {
    const result = formatRules({ rules: [], mode: 'balanced' })
    expect(result).toBe('')
  })

  it('joins with double newline in balanced mode', () => {
    const result = formatRules({ rules: [RULE_A, RULE_B], mode: 'balanced' })
    expect(result).toContain('\n\n')
  })

  it('joins with double newline in verbose mode', () => {
    const result = formatRules({ rules: [RULE_A, RULE_B], mode: 'verbose' })
    expect(result).toContain('\n\n')
  })

  it('joins with single newline in concise mode', () => {
    const result = formatRules({ rules: [RULE_A, RULE_B], mode: 'concise' })
    expect(result).not.toContain('\n\n')
  })

  it('ends with trailing newline', () => {
    const result = formatRules({ rules: [RULE_A], mode: 'balanced' })
    expect(result).toMatch(/\n$/)
  })

  it('formats single rule correctly', () => {
    const result = formatRules({ rules: [RULE_A], mode: 'balanced' })
    expect(result).toBe(
      'Rule: Use consistent whitespace for readability. all source files\n'
        + 'Reason: Whitespace is critical for readability.\n',
    )
  })

  it('formats multiple rules with context', () => {
    const result = formatRules({ rules: [RULE_A, RULE_B], mode: 'balanced' })
    expect(result).toContain('Rule: Use consistent whitespace')
    expect(result).toContain('Rule: Avoid non-null assertions.')
    expect(result).toContain('when accessing optional values')
  })
})
