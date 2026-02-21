import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { buildFormatPrompt, buildParsePrompt } from './prompt.ts'

describe('buildParsePrompt', () => {
  it('includes the instruction text', () => {
    const prompt = buildParsePrompt('Always use semicolons.')

    assertEquals(prompt.includes('Always use semicolons.'), true)
  })

  it('includes parser role instructions', () => {
    const prompt = buildParsePrompt('test')

    assertEquals(prompt.includes('rule parser'), true)
    assertEquals(prompt.includes('Instructions to parse:'), true)
  })

  it('mentions required fields', () => {
    const prompt = buildParsePrompt('test')

    assertEquals(prompt.includes('strength'), true)
    assertEquals(prompt.includes('action'), true)
    assertEquals(prompt.includes('target'), true)
    assertEquals(prompt.includes('context'), true)
    assertEquals(prompt.includes('reason'), true)
  })
})

describe('buildFormatPrompt', () => {
  it('includes the parsed rules JSON', () => {
    const json = JSON.stringify([{ strength: 'obligatory', action: 'use', target: 'semicolons' }])
    const prompt = buildFormatPrompt(json)

    assertEquals(prompt.includes(json), true)
  })

  it('includes formatter role instructions', () => {
    const prompt = buildFormatPrompt('[]')

    assertEquals(prompt.includes('rule formatter'), true)
    assertEquals(prompt.includes('Parsed rules to convert:'), true)
  })

  it('mentions clarity and actionability', () => {
    const prompt = buildFormatPrompt('[]')

    assertEquals(prompt.includes('clear'), true)
    assertEquals(prompt.includes('concise'), true)
    assertEquals(prompt.includes('actionable'), true)
  })
})
