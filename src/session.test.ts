import { describe, expect, it } from 'bun:test'
import { extractText } from './session.ts'

describe('extractText', () => {
  it('extracts text from a single text part', () => {
    const parts = [{ type: 'text', text: 'hello' }]
    expect(extractText(parts)).toEqual('hello')
  })

  it('concatenates multiple text parts', () => {
    const parts = [
      { type: 'text', text: 'hello ' },
      { type: 'text', text: 'world' },
    ]
    expect(extractText(parts)).toEqual('hello world')
  })

  it('skips non-text parts', () => {
    const parts = [
      { type: 'tool_call', text: 'ignored' },
      { type: 'text', text: 'kept' },
      { type: 'image' },
    ]
    expect(extractText(parts)).toEqual('kept')
  })

  it('returns empty string for empty array', () => {
    expect(extractText([])).toEqual('')
  })

  it('returns empty string when no text parts exist', () => {
    const parts = [
      { type: 'tool_call' },
      { type: 'image' },
    ]
    expect(extractText(parts)).toEqual('')
  })

  it('skips text parts with empty text', () => {
    const parts = [
      { type: 'text', text: '' },
      { type: 'text', text: 'valid' },
    ]
    expect(extractText(parts)).toEqual('valid')
  })

  it('skips text parts with undefined text', () => {
    const parts = [
      { type: 'text' },
      { type: 'text', text: 'valid' },
    ]
    expect(extractText(parts)).toEqual('valid')
  })
})
