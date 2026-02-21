import { describe, expect, it } from 'bun:test'
import { stripCodeFences } from './stripCodeFences.ts'

describe('stripCodeFences', () => {
  it('returns plain text unchanged', () => {
    expect(stripCodeFences('hello world')).toEqual('hello world')
  })

  it('strips ```json fence', () => {
    const input = '```json\n{"rules": []}\n```'
    expect(stripCodeFences(input)).toEqual('{"rules": []}')
  })

  it('strips bare ``` fence', () => {
    const input = '```\n{"rules": []}\n```'
    expect(stripCodeFences(input)).toEqual('{"rules": []}')
  })

  it('strips fence with trailing whitespace', () => {
    const input = '```json  \n{"rules": []}\n```  '
    expect(stripCodeFences(input)).toEqual('{"rules": []}')
  })

  it('trims surrounding whitespace', () => {
    const input = '  \n {"rules": []}  \n '
    expect(stripCodeFences(input)).toEqual('{"rules": []}')
  })

  it('handles empty string', () => {
    expect(stripCodeFences('')).toEqual('')
  })

  it('handles fence with no content', () => {
    const input = '```json\n```'
    expect(stripCodeFences(input)).toEqual('')
  })

  it('preserves inner newlines', () => {
    const input = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```'
    expect(stripCodeFences(input)).toEqual('{\n  "a": 1,\n  "b": 2\n}')
  })

  it('strips fence preceded by text on the same line', () => {
    const input = 'Here is the JSON: ```json\n{"rules": []}\n```'
    expect(stripCodeFences(input)).toEqual('{"rules": []}')
  })
})
