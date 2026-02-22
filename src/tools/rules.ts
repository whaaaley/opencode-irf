import { tool } from '@opencode-ai/plugin'
import { appendRules } from '../append.ts'
import { buildTable, toTableRow } from '../compare.ts'
import { resolveFiles } from '../resolve.ts'
import { type FileResult, processFile } from '../rewrite.ts'
import { FormatResponseSchema, ParseResponseSchema } from '../rule-schema.ts'
import { formatValidationError, validateJson } from '../validate.ts'
import { FORMAT_RULES_DESC, MODE_DESC, PARSE_RULES_DESC } from './descriptions.ts'

// discover-rules

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

// parse-rules

type ParseRulesToolOptions = {
  description: string
}

export const createParseRulesTool = (options: ParseRulesToolOptions) => {
  return tool({
    description: options.description,
    args: {
      rules: tool.schema.string().describe(PARSE_RULES_DESC),
    },
    async execute(args) {
      const validated = validateJson(args.rules, ParseResponseSchema)
      if (validated.error !== null) {
        return formatValidationError(validated)
      }

      return JSON.stringify(validated.data, null, 2)
    },
  })
}

// format-rules

type FormatRulesToolOptions = {
  description: string
}

export const createFormatRulesTool = (options: FormatRulesToolOptions) => {
  return tool({
    description: options.description,
    args: {
      rules: tool.schema.string().describe(FORMAT_RULES_DESC),
      mode: tool.schema.string().optional().describe(MODE_DESC),
    },
    async execute(args) {
      const validated = validateJson(args.rules, FormatResponseSchema)
      if (validated.error !== null) {
        return formatValidationError(validated)
      }

      return JSON.stringify(validated.data, null, 2)
    },
  })
}

// rewrite-rules

type RewriteToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

export const createRewriteTool = (options: RewriteToolOptions) => {
  return tool({
    description: options.description,
    args: {
      rules: tool.schema.string().describe(FORMAT_RULES_DESC),
      files: tool.schema.string().optional()
        .describe('Comma-separated file paths to process instead of discovering from opencode.json'),
      mode: tool.schema.string().optional().describe(MODE_DESC),
    },
    async execute(args, context) {
      if (options.discovered.size === 0) {
        return 'Call discover-rules first to read the instruction files before rewriting.'
      }

      const validated = validateJson(args.rules, FormatResponseSchema)
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
            rules: validated.data.rules,
          }),
        )
      }

      return buildTable(fileResults.map(toTableRow))
    },
  })
}

// add-rules

type AddToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

export const createAddTool = (options: AddToolOptions) => {
  return tool({
    description: options.description,
    args: {
      rules: tool.schema.string().describe(FORMAT_RULES_DESC),
      file: tool.schema.string().optional()
        .describe('File path to append to. If omitted, uses the first discovered instruction file.'),
      mode: tool.schema.string().optional().describe(MODE_DESC),
    },
    async execute(args) {
      if (options.discovered.size === 0) {
        return 'Call discover-rules first to read the instruction files before adding.'
      }

      const validated = validateJson(args.rules, FormatResponseSchema)
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
        rules: validated.data.rules,
      })

      if (result.status !== 'success') {
        return result.status + ': ' + result.error
      }

      return 'Added ' + result.rulesCount + ' rule(s) to ' + result.path
    },
  })
}
