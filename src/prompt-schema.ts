import { z } from 'zod'

export const IntentSchema = z.string()
  .describe('What to do, expressed as a clear directive')
  .meta({
    examples: ['refactor', 'document', 'test', 'commit', 'publish', 'research', 'fix', 'implement'],
  })

export const TaskTargetsSchema = z.array(z.string())
  .describe('Files, systems, or things involved')
  .meta({
    examples: [
      'src/utils.ts',
      'README.md',
      'npm',
      'git-undo tool',
      'plugin end-to-end',
      'SAT tool sessions',
    ],
  })

export const ConstraintsSchema = z.array(z.string())
  .describe('Conditions, preferences, or requirements')
  .meta({
    examples: [
      'preserve public API',
      'add tests',
      'match existing conventions',
      'needs OTP from user',
      'sort alphabetically',
      'low priority',
    ],
  })

export const TaskContextSchema = z.string()
  .describe('Background info or rationale for the task')
  .meta({
    examples: [
      'previous version had inconsistent naming',
      'user reported performance regression',
      'required for next release',
    ],
  })

export const ParsedTaskSchema: z.ZodType<ParsedTask> = z.object({
  intent: IntentSchema,
  targets: TaskTargetsSchema.default([]),
  constraints: ConstraintsSchema.default([]),
  context: TaskContextSchema.optional(),
  subtasks: z.lazy(() => z.array(ParsedTaskSchema)).default([]),
})
  .describe('Single task decomposed into action/planning components')
  .meta({
    examples: [{
      intent: 'refactor',
      targets: ['src/utils.ts'],
      constraints: ['preserve public API', 'add tests'],
      subtasks: [],
    }, {
      intent: 'document',
      targets: ['README.md'],
      constraints: ['match existing conventions', 'sort alphabetically'],
      subtasks: [],
    }, {
      intent: 'publish',
      targets: ['npm'],
      constraints: ['version 0.0.1-next.1', '--tag next', 'needs OTP from user'],
      subtasks: [],
    }],
  })

export const ParsedPromptSchema = z.object({
  tasks: z.array(ParsedTaskSchema),
})

export type ParsedTask = {
  intent: string
  targets: Array<string>
  constraints: Array<string>
  context?: string
  subtasks: Array<ParsedTask>
}

export type ParsedPrompt = z.infer<typeof ParsedPromptSchema>

export const promptSchemaExample = JSON.stringify(z.toJSONSchema(ParsedPromptSchema))
