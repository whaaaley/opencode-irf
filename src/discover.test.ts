import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { discover } from './discover.ts'

const makeTmpDir = async () => {
  return await mkdtemp(join(tmpdir(), 'irf-discover-'))
}

const writeConfig = async (dir: string, config: Record<string, unknown>) => {
  await writeFile(join(dir, 'opencode.json'), JSON.stringify(config), 'utf-8')
}

const writeInstruction = async (dir: string, relativePath: string, content: string) => {
  const full = join(dir, relativePath)
  const parent = full.substring(0, full.lastIndexOf('/'))
  await mkdir(parent, { recursive: true })
  await writeFile(full, content, 'utf-8')
}

describe('discover', () => {
  it('returns error when opencode.json is missing', async () => {
    const dir = await makeTmpDir()
    const result = await discover(dir)

    assertEquals(result.data, null)
    assertEquals(typeof result.error, 'string')
    assertEquals(result.error!.includes('Could not read'), true)

    await rm(dir, { recursive: true })
  })

  it('returns error when instructions array is missing', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { theme: 'opencode' })
    const result = await discover(dir)

    assertEquals(result.data, null)
    assertEquals(result.error!.includes('No "instructions" array'), true)

    await rm(dir, { recursive: true })
  })

  it('returns error when instructions array is empty', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { instructions: [] })
    const result = await discover(dir)

    assertEquals(result.data, null)
    assertEquals(result.error!.includes('No "instructions" array'), true)

    await rm(dir, { recursive: true })
  })

  it('returns error when no files match patterns', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { instructions: ['nonexistent/*.md'] })
    const result = await discover(dir)

    assertEquals(result.data, null)
    assertEquals(result.error!.includes('No instruction files found matching'), true)

    await rm(dir, { recursive: true })
  })

  it('discovers files matching a single glob pattern', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { instructions: ['docs/*.md'] })
    await writeInstruction(dir, 'docs/rules.md', 'rule content')
    const result = await discover(dir)

    assertEquals(result.error, null)
    assertEquals(result.data!.length, 1)
    assertEquals(result.data![0].path, join(dir, 'docs/rules.md'))
    assertEquals(result.data![0].content, 'rule content')

    await rm(dir, { recursive: true })
  })

  it('discovers files matching multiple glob patterns', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { instructions: ['docs/*.md', 'agents/*.md'] })
    await writeInstruction(dir, 'docs/a.md', 'alpha')
    await writeInstruction(dir, 'agents/b.md', 'beta')
    const result = await discover(dir)

    assertEquals(result.error, null)
    assertEquals(result.data!.length, 2)

    const paths = result.data!.map((f) => f.path)
    assertEquals(paths.includes(join(dir, 'docs/a.md')), true)
    assertEquals(paths.includes(join(dir, 'agents/b.md')), true)

    await rm(dir, { recursive: true })
  })

  it('deduplicates files matched by overlapping patterns', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { instructions: ['docs/*.md', 'docs/rules.md'] })
    await writeInstruction(dir, 'docs/rules.md', 'content')
    const result = await discover(dir)

    assertEquals(result.error, null)
    assertEquals(result.data!.length, 1)

    await rm(dir, { recursive: true })
  })

  it('reads file content correctly', async () => {
    const dir = await makeTmpDir()
    const content = 'Use conventional commits.\nAlways write tests.'
    await writeConfig(dir, { instructions: ['*.md'] })
    await writeInstruction(dir, 'rules.md', content)
    const result = await discover(dir)

    assertEquals(result.error, null)
    assertEquals(result.data![0].content, content)

    await rm(dir, { recursive: true })
  })

  it('returns error content for unreadable files', async () => {
    const dir = await makeTmpDir()
    await writeConfig(dir, { instructions: ['docs/*.md'] })
    await writeInstruction(dir, 'docs/good.md', 'good content')
    // create a directory where a file is expected to trick readFile
    await mkdir(join(dir, 'docs/bad.md'), { recursive: true })
    const result = await discover(dir)

    assertEquals(result.error, null)
    assertEquals(result.data!.length, 2)

    const bad = result.data!.find((f) => f.path.includes('bad.md'))
    assertEquals(bad!.content.includes('**Error reading file:'), true)

    await rm(dir, { recursive: true })
  })
})
