import { readFile, writeFile } from 'node:fs/promises'
import { type FormatMode, formatRules } from './format.ts'
import type { ParsedRule } from './rule-schema.ts'
import { safeAsync } from './utils/safe.ts'

type AppendResultSuccess = {
  status: 'success'
  path: string
  rulesCount: number
}

type AppendResultReadError = {
  status: 'readError'
  path: string
  error: string
}

type AppendResultWriteError = {
  status: 'writeError'
  path: string
  error: string
}

export type AppendResult =
  | AppendResultSuccess
  | AppendResultReadError
  | AppendResultWriteError

type AppendRulesOptions = {
  filePath: string
  rules: Array<ParsedRule>
  mode: FormatMode
}

const computeSeparator = (existing: string, mode: FormatMode): string => {
  if (existing.length === 0) {
    return ''
  }

  if (mode === 'concise') {
    if (existing.endsWith('\n')) {
      return ''
    }
    return '\n'
  }

  if (existing.endsWith('\n\n')) {
    return ''
  }

  if (existing.endsWith('\n')) {
    return '\n'
  }

  return '\n\n'
}

export const appendRules = async (options: AppendRulesOptions): Promise<AppendResult> => {
  const readResult = await safeAsync(() => readFile(options.filePath, 'utf-8'))
  if (readResult.error) {
    return {
      status: 'readError',
      path: options.filePath,
      error: readResult.error.message,
    }
  }

  const formatted = formatRules({
    rules: options.rules,
    mode: options.mode,
  })

  const existing = readResult.data
  const separator = computeSeparator(existing, options.mode)
  const content = existing + separator + formatted

  const writeResult = await safeAsync(() => writeFile(options.filePath, content, 'utf-8'))
  if (writeResult.error) {
    return {
      status: 'writeError',
      path: options.filePath,
      error: writeResult.error.message,
    }
  }

  return {
    status: 'success',
    path: options.filePath,
    rulesCount: options.rules.length,
  }
}
