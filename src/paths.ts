import { dirname, join } from '@std/path'

// Strip the fixtures prefix and file extension from a fixture path
export const fixtureBaseName = (fixturePath: string): string => {
  return fixturePath.replace('fixtures/', '').replace(/\.[^.]+$/, '')
}

// Build all output paths for a given fixture path
export const outputPaths = (fixturePath: string) => {
  const base = fixtureBaseName(fixturePath)

  return {
    dir: dirname(join('dist', base)),
    markdown: join('dist', `${base}.md`),
    parsedJson: join('dist', `${base}.parsed.json`),
    rulesJson: join('dist', `${base}.rules.json`),
  }
}
