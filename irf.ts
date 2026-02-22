import type { Plugin } from '@opencode-ai/plugin'
import { tool } from '@opencode-ai/plugin'
import { buildComparisonSection, formatFileResult } from './src/format.ts'
import { sendResult } from './src/opencode/notify.ts'
import { processFile, type PromptFn } from './src/process.ts'
import { isFormatMode } from './src/prompt.ts'
import { resolveFiles } from './src/resolve.ts'
import { detectModel, promptWithRetry } from './src/session.ts'
import type { ComparisonResult } from './src/utils/compare.ts'
import { safeAsync } from './src/utils/safe.ts'

const plugin: Plugin = async ({ directory, client }) => {
  return {
    tool: {
      'irf-rewrite': tool({
        description: [
          'Discover instruction files from opencode.json, parse them into structured rules, format them into human-readable rules, and write the formatted rules back to the original files.',
          'Accepts an optional mode: verbose (full Rule/Reason pairs), balanced (LLM decides which rules need reasons), or concise (bullet list, no reasons).',
          'Defaults to balanced.',
          'Accepts an optional files parameter to process specific files instead of running discovery.',
        ].join(' '),
        args: {
          mode: tool.schema.string().optional().describe(
            'Output format: verbose, balanced, or concise (default: balanced)',
          ),
          files: tool.schema.string().optional().describe(
            'Comma-separated file paths to process instead of discovering from opencode.json',
          ),
        },
        async execute(args, context) {
          // validate mode argument
          const mode = isFormatMode(args.mode) ? args.mode : 'balanced'
          try {
            // resolve files: explicit paths or discovery
            const resolved = await resolveFiles(directory, args.files)
            if (resolved.error !== null) {
              return resolved.error
            }
            const files = resolved.data

            // detect model from current session
            const model = await detectModel(client, context.sessionID)
            if (!model) {
              return 'Could not detect current model. Send a message first, then call irf-rewrite.'
            }

            // create a session for internal LLM calls
            const sessionResult = await client.session.create({
              body: {
                title: 'IRF Parse',
              },
            })
            if (!sessionResult.data) {
              return 'Failed to create internal session'
            }
            const sessionId = sessionResult.data.id

            // close over session details so processFile only needs a prompt callback
            const prompt: PromptFn = (text, schema) =>
              promptWithRetry({
                client,
                sessionId,
                initialPrompt: text,
                schema,
                model,
              })

            // process files sequentially; parallel prompting through a shared
            // session may cause ordering issues depending on SDK behavior
            const results: string[] = []
            const comparisons: ComparisonResult[] = []

            for (const file of files) {
              // bail if the tool call was cancelled
              if (context.abort.aborted) {
                results.push('Cancelled')
                break
              }

              const fileResult = await processFile({
                file,
                prompt,
                mode,
              })
              if (fileResult.status === 'success') {
                comparisons.push(fileResult.comparison)
              }
              results.push(formatFileResult(fileResult))
            }

            // clean up the internal session
            await safeAsync(() =>
              client.session.delete({
                path: { id: sessionId },
              })
            )

            // send comparison table directly to chat
            const tableSection = buildComparisonSection(comparisons)
            if (tableSection.length > 0) {
              await sendResult({
                client,
                sessionID: context.sessionID,
                text: tableSection.join('\n'),
              })
            }

            return results.join('\n')
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            return 'irf-rewrite error: ' + msg
          }
        },
      }),
    },
  }
}

export default plugin
