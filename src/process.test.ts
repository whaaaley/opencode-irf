import { describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { FormatMode } from './format.ts'
import { type FileResult, processFile } from './process.ts'
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

const expectStatus = (result: FileResult, expected: FileResult['status']) => {
  expect(result.status).toBe(expected)
}

describe('processFile', () => {
  let dir: string

  const setup = async (content: string) => {
    dir = await mkdtemp(join(tmpdir(), 'sat-process-'))
    const filePath = join(dir, 'instructions.md')
    await writeFile(filePath, content, 'utf-8')
    return filePath
  }

  const cleanup = async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true })
    }
  }

  it('returns readError when file has error', async () => {
    const result = await processFile({
      file: { path: '/fake/path.md', content: '', error: 'ENOENT' },
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'readError')
    if (result.status === 'readError') {
      expect(result.error).toBe('ENOENT')
    }

    await cleanup()
  })

  it('writes formatted rules to file', async () => {
    const filePath = await setup('old content\n')

    const result = await processFile({
      file: { path: filePath, content: 'old content\n' },
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('Rule:')
    expect(written).toContain('Reason:')
    expect(written).not.toContain('old content')

    await cleanup()
  })

  it('includes comparison in success result', async () => {
    const filePath = await setup('old content\n')

    const result = await processFile({
      file: { path: filePath, content: 'old content\n' },
      rules: [RULE_A],
      mode: 'balanced',
    })

    expectStatus(result, 'success')
    if (result.status === 'success') {
      expect(result.comparison).toBeDefined()
      expect(result.rulesCount).toBe(1)
    }

    await cleanup()
  })

  it('formats with double newline in balanced mode', async () => {
    const filePath = await setup('')

    const result = await processFile({
      file: { path: filePath, content: '' },
      rules: [RULE_A, RULE_B],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('\n\n')

    await cleanup()
  })

  it('formats with single newline in concise mode', async () => {
    const filePath = await setup('')

    const result = await processFile({
      file: { path: filePath, content: '' },
      rules: [RULE_A, RULE_B],
      mode: 'concise',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).not.toContain('\n\n')
    expect(written).not.toContain('Reason:')

    await cleanup()
  })

  it('propagates file path in result', async () => {
    const filePath = await setup('')

    const result = await processFile({
      file: { path: filePath, content: '' },
      rules: [RULE_A],
      mode: 'balanced',
    })

    expect(result.path).toBe(filePath)

    await cleanup()
  })

  it('includes context in rule when present', async () => {
    const filePath = await setup('')

    const result = await processFile({
      file: { path: filePath, content: '' },
      rules: [RULE_B],
      mode: 'balanced',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('when accessing optional values')

    await cleanup()
  })

  it('omits reason in concise mode', async () => {
    const filePath = await setup('')

    const result = await processFile({
      file: { path: filePath, content: '' },
      rules: [RULE_A],
      mode: 'concise',
    })

    expectStatus(result, 'success')

    const written = await readFile(filePath, 'utf-8')
    expect(written).toContain('Rule:')
    expect(written).not.toContain('Reason:')

    await cleanup()
  })

  it('formats rules for all three modes', async () => {
    const modes: Array<FormatMode> = ['verbose', 'balanced', 'concise']

    for (const mode of modes) {
      const filePath = await setup('')

      const result = await processFile({
        file: { path: filePath, content: '' },
        rules: [RULE_A],
        mode,
      })

      expectStatus(result, 'success')

      const written = await readFile(filePath, 'utf-8')
      expect(written).toContain('Rule:')

      if (mode === 'concise') {
        expect(written).not.toContain('Reason:')
      } else {
        expect(written).toContain('Reason:')
      }

      await cleanup()
    }
  })
})
