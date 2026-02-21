import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { fixtureBaseName, outputPaths } from './paths.ts'

describe('fixtureBaseName', () => {
  it('strips fixtures prefix and extension', () => {
    assertEquals(fixtureBaseName('fixtures/cynthia/instructions/git.instructions.md'), 'cynthia/instructions/git.instructions')
  })

  it('handles single-level paths', () => {
    assertEquals(fixtureBaseName('fixtures/readme.md'), 'readme')
  })

  it('strips only the last extension', () => {
    assertEquals(fixtureBaseName('fixtures/foo/bar.baz.txt'), 'foo/bar.baz')
  })
})

describe('outputPaths', () => {
  it('returns correct paths for a nested fixture', () => {
    const paths = outputPaths('fixtures/cynthia/instructions/git.instructions.md')

    assertEquals(paths.dir, 'dist/cynthia/instructions')
    assertEquals(paths.markdown, 'dist/cynthia/instructions/git.instructions.md')
    assertEquals(paths.parsedJson, 'dist/cynthia/instructions/git.instructions.parsed.json')
    assertEquals(paths.rulesJson, 'dist/cynthia/instructions/git.instructions.rules.json')
  })

  it('returns correct paths for a top-level fixture', () => {
    const paths = outputPaths('fixtures/readme.md')

    assertEquals(paths.dir, 'dist')
    assertEquals(paths.markdown, 'dist/readme.md')
    assertEquals(paths.parsedJson, 'dist/readme.parsed.json')
    assertEquals(paths.rulesJson, 'dist/readme.rules.json')
  })
})
