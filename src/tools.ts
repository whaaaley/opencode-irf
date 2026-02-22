import { tool } from '@opencode-ai/plugin'
import { basename } from 'node:path'
import { appendRules } from './append.ts'
import { formatPrompt } from './format-prompt.ts'
import { type FormatMode, isFormatMode } from './format.ts'
import { type FileResult, processFile } from './process.ts'
import { ParsedPromptSchema, promptSchemaExample } from './prompt-schema.ts'
import { resolveFiles } from './resolve.ts'
import { ParsedSchema, parseSchemaExample } from './rule-schema.ts'
import { buildTable, type TableRow } from './utils/compare.ts'
import { formatValidationError, validateJson } from './utils/validate.ts'

const ERROR_LABELS: Record<string, string> = {
  readError: 'Read failed',
  writeError: 'Write failed',
}

const toTableRow = (result: FileResult): TableRow => {
  if (result.status === 'success') {
    return {
      file: basename(result.path),
      status: 'Success',
      rules: result.rulesCount,
      comparison: result.comparison,
    }
  }

  const label = ERROR_LABELS[result.status] || result.status

  return {
    file: basename(result.path),
    status: label,
  }
}

const RULE_SCHEMA_DESC = [
  'Array of parsed rules. Each rule: {',
  '  strength: obligatory|permissible|forbidden|optional|supererogatory|indifferent|omissible,',
  '  action: imperative verb describing what to do,',
  '  target: what the action applies to,',
  '  context: (optional) when/where the rule applies,',
  '  reason: why the rule exists',
  '}',
  'Example: ' + parseSchemaExample,
].join('\n')

const TASK_SCHEMA_DESC = [
  'Array of parsed tasks. Each task: {',
  '  intent: clear directive of what to do,',
  '  targets: files/systems involved (default []),',
  '  constraints: conditions/requirements (default []),',
  '  context: (optional) background rationale,',
  '  subtasks: nested tasks (default [])',
  '}',
  'Example: ' + promptSchemaExample,
].join('\n')

type DiscoverToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

export const createDiscoverTool = (options: DiscoverToolOptions) => {
  return tool({
    description: options.description,
    args: {
      files: tool.schema
        .string()
        .optional()
        .describe('Comma-separated file paths to read instead of discovering from opencode.json'),
    },
    async execute(args) {
      const resolved = await resolveFiles(options.directory, args.files)
      if (resolved.error !== null) {
        return resolved.error
      }

      if (resolved.data.length === 0) {
        return 'No instruction files found'
      }

      for (const file of resolved.data) {
        options.discovered.add(file.path)
      }

      const sections = resolved.data.map((file) => {
        if (file.error) {
          return '## ' + file.path + '\n\nError: ' + file.error
        }

        if (file.content.length === 0) {
          return '## ' + file.path + '\n\n(empty file)'
        }

        return '## ' + file.path + '\n\n' + file.content
      })

      return sections.join('\n\n---\n\n')
    },
  })
}

type RewriteToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

export const createRewriteTool = (options: RewriteToolOptions) => {
  return tool({
    description: options.description,
    args: {
      rules: tool.schema.string().describe(RULE_SCHEMA_DESC),
      mode: tool.schema
        .string()
        .optional()
        .describe('Output format: verbose, balanced, or concise (default: balanced)'),
      files: tool.schema
        .string()
        .optional()
        .describe('Comma-separated file paths to process instead of discovering from opencode.json'),
    },
    async execute(args, context) {
      if (options.discovered.size === 0) {
        return 'Call discover-instructions first to read the instruction files before rewriting.'
      }

      const mode: FormatMode = isFormatMode(args.mode) ? args.mode : 'balanced'

      const validated = validateJson(args.rules, ParsedSchema)
      if (validated.error !== null) {
        return formatValidationError(validated)
      }

      const resolved = await resolveFiles(options.directory, args.files)
      if (resolved.error !== null) {
        return resolved.error
      }

      const fileResults: Array<FileResult> = []

      for (const file of resolved.data) {
        if (context.abort.aborted) {
          break
        }

        fileResults.push(
          await processFile({
            file,
            rules: validated.data,
            mode,
          }),
        )
      }

      return buildTable(fileResults.map(toTableRow))
    },
  })
}

type AppendToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

export const createAppendTool = (options: AppendToolOptions) => {
  return tool({
    description: options.description,
    args: {
      input: tool.schema
        .string()
        .describe('The original unstructured text that was parsed into rules'),
      rules: tool.schema.string().describe(RULE_SCHEMA_DESC),
      file: tool.schema
        .string()
        .optional()
        .describe('File path to append to. If omitted, uses the first discovered instruction file.'),
      mode: tool.schema
        .string()
        .optional()
        .describe('Output format: verbose, balanced, or concise (default: balanced)'),
    },
    async execute(args) {
      if (options.discovered.size === 0) {
        return 'Call discover-instructions first to read the instruction files before appending.'
      }

      const mode: FormatMode = isFormatMode(args.mode) ? args.mode : 'balanced'

      const validated = validateJson(args.rules, ParsedSchema)
      if (validated.error !== null) {
        return formatValidationError(validated)
      }

      let filePath = args.file

      if (!filePath) {
        const resolved = await resolveFiles(options.directory)
        if (resolved.error !== null) {
          return resolved.error
        }

        const first = resolved.data[0]
        if (!first) {
          return 'No instruction files found in opencode.json'
        }

        filePath = first.path
      }

      const result = await appendRules({
        filePath,
        rules: validated.data,
        mode,
      })

      if (result.status !== 'success') {
        return result.status + ': ' + result.error
      }

      return 'Added ' + result.rulesCount + ' rule(s) to ' + result.path
    },
  })
}

type RefineToolOptions = {
  description: string
}

export const createRefineTool = (options: RefineToolOptions) => {
  return tool({
    description: options.description,
    args: {
      input: tool.schema.string()
        .describe('The original unstructured user input that was decomposed'),
      tasks: tool.schema.string().describe(TASK_SCHEMA_DESC),
    },
    async execute(args) {
      const validated = validateJson(args.tasks, ParsedPromptSchema)
      if (validated.error !== null) {
        return formatValidationError(validated)
      }

      const formatted = formatPrompt(validated.data)

      if (formatted.length === 0) {
        return 'No tasks found in the parsed input'
      }

      return formatted
    },
  })
}
