import { readFile, writeFile } from 'node:fs/promises'
import { safeAsync } from './safe.ts'

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

export type AppendResult = AppendResultSuccess | AppendResultReadError | AppendResultWriteError

type AppendRulesOptions = {
  filePath: string
  rules: Array<string>
}

const computeSeparator = (existing: string): string => {
  if (existing.length === 0) {
    return ''
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

  const formatted = options.rules.join('\n\n') + '\n'
  const existing = readResult.data
  const separator = computeSeparator(existing)
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
