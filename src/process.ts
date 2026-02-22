import { writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import type { InstructionFile } from './discover.ts'
import { type FormatMode, formatRules } from './format.ts'
import type { ParsedRule } from './rule-schema.ts'
import { compareBytes, type ComparisonResult } from './utils/compare.ts'
import { safeAsync } from './utils/safe.ts'

type FileResultSuccess = {
  status: 'success'
  path: string
  rulesCount: number
  comparison: ComparisonResult
}

type FileResultError = {
  status: 'readError' | 'writeError'
  path: string
  error: string
}

export type FileResult = FileResultSuccess | FileResultError

type ProcessFileOptions = {
  file: InstructionFile
  rules: Array<ParsedRule>
  mode: FormatMode
}

export const processFile = async (options: ProcessFileOptions): Promise<FileResult> => {
  if (options.file.error) {
    return {
      status: 'readError',
      path: options.file.path,
      error: options.file.error,
    }
  }

  const content = formatRules({
    rules: options.rules,
    mode: options.mode,
  })

  const writeResult = await safeAsync(() => writeFile(options.file.path, content, 'utf-8'))
  if (writeResult.error) {
    return {
      status: 'writeError',
      path: options.file.path,
      error: writeResult.error.message,
    }
  }

  const comparison = compareBytes(basename(options.file.path), options.file.content, content)

  return {
    status: 'success',
    path: options.file.path,
    rulesCount: options.rules.length,
    comparison,
  }
}
