export type ComparisonResult = {
  file: string
  originalBytes: number
  generatedBytes: number
  difference: number
  savings: boolean
  percentChange: number
}

/** Compare the byte sizes of two strings and return the diff stats */
export const compareBytes = (file: string, original: string, generated: string): ComparisonResult => {
  const originalBytes = new TextEncoder().encode(original).length
  const generatedBytes = new TextEncoder().encode(generated).length
  const difference = originalBytes - generatedBytes
  const savings = difference > 0
  const percentChange = originalBytes === 0 ? 0 : (difference / originalBytes) * 100

  return { file, originalBytes, generatedBytes, difference, savings, percentChange }
}

/** Format a single comparison result as a table row */
export const formatRow = (result: ComparisonResult): string => {
  const changeStr = result.savings
    ? `\u2212${result.percentChange.toFixed(1)}%`
    : `+${Math.abs(result.percentChange).toFixed(1)}%`

  const icon = result.savings ? '\u{1F7E2}' : '\u{1F534}'

  return (
    result.file.padEnd(25) +
    result.originalBytes.toString().padStart(10) +
    result.generatedBytes.toString().padStart(12) +
    result.difference.toString().padStart(8) +
    `${icon} ${changeStr}`.padStart(12)
  )
}

/** Summarize an array of comparison results into totals */
export const summarize = (results: ComparisonResult[]) => {
  const totalOriginal = results.reduce((sum, r) => sum + r.originalBytes, 0)
  const totalGenerated = results.reduce((sum, r) => sum + r.generatedBytes, 0)
  const totalDifference = totalOriginal - totalGenerated
  const totalSavings = totalDifference > 0
  const totalPercentChange = totalOriginal === 0 ? 0 : (totalDifference / totalOriginal) * 100

  return { totalOriginal, totalGenerated, totalDifference, totalSavings, totalPercentChange }
}
