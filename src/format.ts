import type { FileResult } from './process.ts'
import { buildTable, type ComparisonResult } from './utils/compare.ts'

const ERROR_LABELS: Record<Exclude<FileResult['status'], 'success'>, string> = {
  readError: 'Read failed',
  parseError: 'Parse failed',
  formatError: 'Format failed',
  writeError: 'Write failed',
}

// format a file result into a markdown status line
export const formatFileResult = (result: FileResult): string => {
  if (result.status === 'success') {
    return '**' + result.path + '**: ' + result.rulesCount + ' rules written'
  }
  return '**' + result.path + '**: ' + ERROR_LABELS[result.status] + ' - ' + result.error
}

// build comparison table section
export const buildComparisonSection = (comparisons: ComparisonResult[]): string[] => {
  if (comparisons.length === 0) {
    return []
  }
  return [
    '',
    '## Comparison',
    '```',
    buildTable(comparisons),
    '```',
  ]
}
