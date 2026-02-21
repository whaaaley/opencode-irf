import { glob, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { safeAsync } from './utils/safe.util.ts'

export type InstructionFile = {
  path: string
  content: string
}

type DiscoverSuccess = {
  data: InstructionFile[]
  error: null
}

type DiscoverError = {
  data: null
  error: string
}

type DiscoverResult = DiscoverSuccess | DiscoverError

const readConfig = async (directory: string) => {
  const configPath = join(directory, 'opencode.json')
  const { data, error } = await safeAsync(() => readFile(configPath, 'utf-8'))
  if (error || !data) {
    return {
      data: null,
      error: 'Could not read ' + configPath + ': ' + (error ? error.message : 'empty file'),
    }
  }

  const parsed = JSON.parse(data)
  const instructions = parsed.instructions
  if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
    return {
      data: null,
      error: 'No "instructions" array found in ' + configPath,
    }
  }

  return {
    data: instructions as string[],
    error: null,
  }
}

const resolveFiles = async (directory: string, patterns: string[]) => {
  const seen = new Set<string>()
  const files: string[] = []

  for (const pattern of patterns) {
    for await (const path of glob(pattern, { cwd: directory })) {
      const full = join(directory, path)
      if (!seen.has(full)) {
        seen.add(full)
        files.push(full)
      }
    }
  }

  return files
}

const readFiles = async (files: string[]) => {
  const results: InstructionFile[] = []

  for (const file of files) {
    const { data, error } = await safeAsync(() => readFile(file, 'utf-8'))
    if (error) {
      results.push({
        path: file,
        content: '**Error reading file: ' + error.message + '**',
      })
    } else {
      results.push({
        path: file,
        content: data,
      })
    }
  }

  return results
}

export const discover = async (directory: string): Promise<DiscoverResult> => {
  const config = await readConfig(directory)
  if (config.error || !config.data) {
    return {
      data: null,
      error: config.error || 'No instructions found',
    }
  }

  const patterns = config.data
  const files = await resolveFiles(directory, patterns)
  if (files.length === 0) {
    return {
      data: null,
      error: 'No instruction files found matching patterns: ' + patterns.join(', '),
    }
  }

  const results = await readFiles(files)

  return {
    data: results,
    error: null,
  }
}
