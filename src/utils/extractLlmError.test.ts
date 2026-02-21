import { describe, expect, it } from 'bun:test'
import { extractLlmError } from './extractLlmError.ts'

describe('extractLlmError', () => {
  it('returns null when no error', () => {
    expect(extractLlmError({ role: 'assistant' })).toEqual(null)
  })

  it('returns null when error is undefined', () => {
    expect(extractLlmError({ role: 'assistant', error: undefined })).toEqual(null)
  })

  it('extracts data.message when present', () => {
    const info = {
      role: 'assistant',
      error: {
        name: 'APIError',
        data: { message: 'rate limit exceeded' },
      },
    }
    expect(extractLlmError(info)).toEqual('rate limit exceeded')
  })

  it('falls back to name when data.message is missing', () => {
    const info = {
      role: 'assistant',
      error: { name: 'TimeoutError' },
    }
    expect(extractLlmError(info)).toEqual('TimeoutError')
  })

  it('falls back to name when data exists but message is missing', () => {
    const info = {
      role: 'assistant',
      error: { name: 'APIError', data: {} },
    }
    expect(extractLlmError(info)).toEqual('APIError')
  })

  it('returns Unknown LLM error when no name or data', () => {
    const info = {
      role: 'assistant',
      error: {},
    }
    expect(extractLlmError(info)).toEqual('Unknown LLM error')
  })
})
