import { describe, expect, it } from 'bun:test'
import { buildFormatPrompt, buildParsePrompt, buildRetryPrompt } from './prompt.ts'

describe('buildParsePrompt', () => {
  it('includes the input text', () => {
    const result = buildParsePrompt('Use conventional commits.')
    expect(result.includes('Use conventional commits.')).toEqual(true)
  })

  it('includes schema example', () => {
    const result = buildParsePrompt('anything')
    expect(result.includes('"strength"')).toEqual(true)
    expect(result.includes('"action"')).toEqual(true)
    expect(result.includes('"target"')).toEqual(true)
    expect(result.includes('"reason"')).toEqual(true)
  })

  it('asks for valid JSON only', () => {
    const result = buildParsePrompt('anything')
    expect(result.includes('Return ONLY valid JSON')).toEqual(true)
  })

  it('mentions all deontic strengths', () => {
    const result = buildParsePrompt('anything')
    expect(result.includes('obligatory')).toEqual(true)
    expect(result.includes('forbidden')).toEqual(true)
    expect(result.includes('permissible')).toEqual(true)
    expect(result.includes('optional')).toEqual(true)
    expect(result.includes('supererogatory')).toEqual(true)
    expect(result.includes('indifferent')).toEqual(true)
    expect(result.includes('omissible')).toEqual(true)
  })
})

describe('buildFormatPrompt', () => {
  it('includes the parsed rules JSON in all modes', () => {
    const json = '{"rules": [{"strength": "obligatory"}]}'
    expect(buildFormatPrompt(json, 'verbose').includes(json)).toEqual(true)
    expect(buildFormatPrompt(json, 'balanced').includes(json)).toEqual(true)
    expect(buildFormatPrompt(json, 'concise').includes(json)).toEqual(true)
  })

  it('asks for valid JSON in all modes', () => {
    expect(buildFormatPrompt('{}', 'verbose').includes('Return ONLY valid JSON')).toEqual(true)
    expect(buildFormatPrompt('{}', 'balanced').includes('Return ONLY valid JSON')).toEqual(true)
    expect(buildFormatPrompt('{}', 'concise').includes('Return ONLY valid JSON')).toEqual(true)
  })

  it('defaults to balanced when mode is omitted', () => {
    const result = buildFormatPrompt('{}')
    expect(result.includes('Use your judgment')).toEqual(true)
  })

  it('verbose mode requires both Rule and Reason for every rule', () => {
    const result = buildFormatPrompt('{}', 'verbose')
    expect(result.includes('Every rule must include both a Rule line and a Reason line')).toEqual(true)
    expect(result.includes('Rule:')).toEqual(true)
    expect(result.includes('Reason:')).toEqual(true)
  })

  it('balanced mode lets the LLM decide which rules need reasons', () => {
    const result = buildFormatPrompt('{}', 'balanced')
    expect(result.includes('Use your judgment')).toEqual(true)
    expect(result.includes('non-obvious or counterintuitive')).toEqual(true)
    expect(result.includes('self-explanatory')).toEqual(true)
  })

  it('concise mode excludes reasons and uses bullet format', () => {
    const result = buildFormatPrompt('{}', 'concise')
    expect(result.includes('Do not include reasons or justifications')).toEqual(true)
    expect(result.includes('"- ..."')).toEqual(true)
  })

  it('produces different prompts for each mode', () => {
    const verbose = buildFormatPrompt('{}', 'verbose')
    const balanced = buildFormatPrompt('{}', 'balanced')
    const concise = buildFormatPrompt('{}', 'concise')

    expect(verbose !== balanced).toEqual(true)
    expect(balanced !== concise).toEqual(true)
    expect(verbose !== concise).toEqual(true)
  })
})

describe('buildRetryPrompt', () => {
  it('includes the error message', () => {
    const result = buildRetryPrompt('Schema validation failed')
    expect(result.includes('Schema validation failed')).toEqual(true)
  })

  it('asks for valid JSON', () => {
    const result = buildRetryPrompt('anything')
    expect(result.includes('Return ONLY valid JSON')).toEqual(true)
  })

  it('mentions previous response was invalid', () => {
    const result = buildRetryPrompt('anything')
    expect(result.includes('previous response was invalid')).toEqual(true)
  })
})
