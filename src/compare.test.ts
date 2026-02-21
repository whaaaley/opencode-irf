import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { compareBytes, formatRow, summarize } from './compare.ts'

describe('compareBytes', () => {
  it('detects savings when original is larger', () => {
    const result = compareBytes('test.md', 'hello world', 'hello')

    assertEquals(result.file, 'test.md')
    assertEquals(result.originalBytes, 11)
    assertEquals(result.generatedBytes, 5)
    assertEquals(result.difference, 6)
    assertEquals(result.savings, true)
  })

  it('detects increase when generated is larger', () => {
    const result = compareBytes('test.md', 'hi', 'hello world')

    assertEquals(result.savings, false)
    assertEquals(result.difference, -9)
  })

  it('handles equal sizes', () => {
    const result = compareBytes('test.md', 'abc', 'xyz')

    assertEquals(result.difference, 0)
    assertEquals(result.savings, false)
    assertEquals(result.percentChange, 0)
  })

  it('handles empty original without dividing by zero', () => {
    const result = compareBytes('test.md', '', 'something')

    assertEquals(result.originalBytes, 0)
    assertEquals(result.percentChange, 0)
  })

  it('correctly measures multi-byte characters', () => {
    const result = compareBytes('test.md', '\u00e9', 'e')

    assertEquals(result.originalBytes, 2)
    assertEquals(result.generatedBytes, 1)
  })
})

describe('formatRow', () => {
  it('returns a formatted string with savings icon', () => {
    const row = formatRow({
      file: 'test.md',
      originalBytes: 100,
      generatedBytes: 80,
      difference: 20,
      savings: true,
      percentChange: 20,
    })

    assertEquals(row.includes('test.md'), true)
    assertEquals(row.includes('100'), true)
    assertEquals(row.includes('80'), true)
    assertEquals(row.includes('\u{1F7E2}'), true)
  })

  it('shows red icon for increase', () => {
    const row = formatRow({
      file: 'big.md',
      originalBytes: 50,
      generatedBytes: 100,
      difference: -50,
      savings: false,
      percentChange: -100,
    })

    assertEquals(row.includes('\u{1F534}'), true)
  })
})

describe('summarize', () => {
  it('sums totals correctly', () => {
    const totals = summarize([
      { file: 'a.md', originalBytes: 100, generatedBytes: 80, difference: 20, savings: true, percentChange: 20 },
      { file: 'b.md', originalBytes: 200, generatedBytes: 150, difference: 50, savings: true, percentChange: 25 },
    ])

    assertEquals(totals.totalOriginal, 300)
    assertEquals(totals.totalGenerated, 230)
    assertEquals(totals.totalDifference, 70)
    assertEquals(totals.totalSavings, true)
  })

  it('handles empty array', () => {
    const totals = summarize([])

    assertEquals(totals.totalOriginal, 0)
    assertEquals(totals.totalGenerated, 0)
    assertEquals(totals.totalDifference, 0)
    assertEquals(totals.totalPercentChange, 0)
  })
})
