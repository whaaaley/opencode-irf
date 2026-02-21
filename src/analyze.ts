import { basename } from '@std/path'
import fg from 'fast-glob'
import { compareBytes, formatRow, summarize } from './compare.ts'
import { fixtureBaseName } from './paths.ts'

const analyzeFiles = async () => {
  const fixtureFiles = await fg(['fixtures/**/*'], { onlyFiles: true })
  const results = []

  for (const fixturePath of fixtureFiles) {
    const distMarkdownPath = `dist/${fixtureBaseName(fixturePath)}.md`

    try {
      const original = await Deno.readTextFile(fixturePath)
      const generated = await Deno.readTextFile(distMarkdownPath)

      results.push(compareBytes(basename(fixturePath), original, generated))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error processing ${fixturePath}:`, errorMessage)
    }
  }

  results.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))

  console.log('\n\u{1F4CA} File Size Analysis: Fixtures vs Generated Markdown\n')
  console.log('File'.padEnd(25) + 'Original'.padStart(10) + 'Generated'.padStart(12) + 'Diff'.padStart(8) + 'Change'.padStart(10))
  console.log('\u2500'.repeat(65))

  for (const result of results) {
    console.log(formatRow(result))
  }

  const totals = summarize(results)

  console.log('\u2500'.repeat(65))
  console.log(
    'TOTAL'.padEnd(25) +
      totals.totalOriginal.toString().padStart(10) +
      totals.totalGenerated.toString().padStart(12) +
      totals.totalDifference.toString().padStart(8) +
      `${totals.totalSavings ? '\u{1F7E2}' : '\u{1F534}'} ${totals.totalSavings ? '\u2212' : '+'}${Math.abs(totals.totalPercentChange).toFixed(1)}%`.padStart(12),
  )

  console.log(
    `\n\u{1F4C8} Summary: ${totals.totalSavings ? 'SAVED' : 'INCREASED'} ${Math.abs(totals.totalDifference)} bytes (${Math.abs(totals.totalPercentChange).toFixed(1)}%)`,
  )
}

analyzeFiles()
