import { describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type AppendResult, appendRules } from './append.ts'
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
  reason: 'Use narrowing type guards instead.',
}

const expectStatus = (
  result: AppendResult,
  expected: AppendResult['status'],
) => {
  expect(result.status).toBe(expected)
}

describe('appendRules', () => {
  let dir: string

  const setup = async (content: string) => {
    dir = await mkdtemp(join(tmpdir(), 'sat-append-'))
    const filePath = join(dir, 'instructions.md')
    await writeFile(filePath, content, 'utf-8')
    return filePath
  }

  const cleanup = async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true })
    }
  }

  it('returns readError for missing file', async () => {
    const result = await appendRules({
      filePath: '/nonexistent/file.md',
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'readError')

    await cleanup()
  })

  it('appends formatted rules to file', async () => {
    const filePath = await setup('Existing content.\n')

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('Existing content.')
    expect(written).toContain('Rule:')
    expect(written).toContain('Reason:')

    await cleanup()
  })

  it('preserves existing content', async () => {
    const existing = 'Rule: Do something.\nReason: Because.\n'
    const filePath = await setup(existing)

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('Rule: Do something.')
    expect(written).toContain(RULE_A.action)

    await cleanup()
  })

  it('uses double newline separator in balanced mode', async () => {
    const filePath = await setup('Existing.\n')

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('Existing.\n\n')

    await cleanup()
  })

  it('uses single newline separator in concise mode', async () => {
    const filePath = await setup('Existing.\n')

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'concise',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).not.toContain('Existing.\n\n')
    expect(written).not.toContain('Reason:')

    await cleanup()
  })

  it('handles file without trailing newline', async () => {
    const filePath = await setup('No trailing newline')

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('No trailing newline')
    expect(written).toContain('Rule:')

    await cleanup()
  })

  it('propagates file path in result', async () => {
    const filePath = await setup('')

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'balanced',
    })

    expect(result.path).toBe(filePath)

    await cleanup()
  })

  it('returns rulesCount in success result', async () => {
    const filePath = await setup('')

    const result = await appendRules({
      filePath,
      rules: [RULE_A, RULE_B],
      mode: 'balanced',
    })

    expectStatus(result, 'success')
    if (result.status === 'success') {
      expect(result.rulesCount).toBe(2)
    }

    await cleanup()
  })

  it('appends to empty file', async () => {
    const filePath = await setup('')

    const result = await appendRules({
      filePath,
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('Rule:')

    await cleanup()
  })
})
