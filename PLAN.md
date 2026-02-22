# SAT Implementation Plan

## File Map

```
sat.ts                      Plugin entry, registers 7 tools
src/tools/rules.ts          5 rule tool creators (discover, parse, format, rewrite, add)
src/tools/prompts.ts        2 prompt tool creators (parse-prompt, format-prompt)
src/tools/descriptions.ts   Description constants for tool args
src/discover.ts             File discovery and reading (unchanged)
src/resolve.ts              File resolution helper (unchanged)
src/rewrite.ts              Write rules to file, return comparison
src/append.ts               Append rules to file
src/format-prompt.ts        Tree renderer for tasks (unchanged)
src/rule-schema.ts          Zod schemas for rules pipeline
src/prompt-schema.ts        Zod schemas for prompt pipeline (unchanged)
src/safe.ts                 Safe sync/async error wrappers (unchanged)
src/validate.ts             JSON parse + Zod validation (unchanged)
src/compare.ts              Byte comparison table builder (unchanged)
```

### Files deleted

```
src/format.ts               Dead code, LLM handles rule formatting now
src/format.test.ts          Tests for dead code
src/tools.ts                Replaced by src/tools/ directory
src/utils/                  Flattened into src/
```

## Tool Creators in tools.ts

### createDiscoverTool

Reads instruction files. Populates the `discovered` set.

```ts
type DiscoverToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

// args
{
  files?: string  // comma-separated paths, or omit for auto-discover
}

// execute
// 1. resolveFiles(directory, args.files)
// 2. Add each file.path to discovered set
// 3. Return markdown sections: "## path\n\ncontent"
// 4. Sections joined with "\n\n---\n\n"
```

No changes needed. Already matches spec.

### createParseRulesTool

Validates ParsedRule JSON from the LLM.

```ts
type ParseRulesToolOptions = {
  description: string
}

// args
{
  rules: string  // JSON matching ParseResponseSchema ({ rules: ParsedRule[] })
}

// execute
// 1. validateJson(args.rules, ParseResponseSchema)
// 2. Return JSON.stringify(validated.data, null, 2)
// 3. On error, return formatValidationError(validated)
```

No changes needed. Already matches spec.

### createFormatRulesTool

Validates formatted rule strings from the LLM.

```ts
type FormatRulesToolOptions = {
  description: string
}

// args
{
  rules: string  // JSON matching FormatResponseSchema ({ rules: string[] })
  mode?: string  // verbose, balanced (default), or concise
}

// execute
// 1. validateJson(args.rules, FormatResponseSchema)
// 2. Return JSON.stringify(validated.data, null, 2)
// 3. On error, return formatValidationError(validated)
```

No changes needed. Already matches spec.

### createRewriteTool

Writes formatted rule strings to instruction files.

```ts
type RewriteToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

// args
{
  rules: string   // JSON matching FormatResponseSchema
  files?: string  // comma-separated paths
  mode?: string   // verbose, balanced (default), or concise
}

// execute
// 1. Guard: discovered.size === 0 -> error
// 2. validateJson(args.rules, FormatResponseSchema)
// 3. resolveFiles(directory, args.files)
// 4. For each file: processFile({ file, rules: validated.data.rules })
// 5. Return buildTable(fileResults.map(toTableRow))
```

No changes needed. Already matches spec.

### createAddTool

Appends formatted rule strings to an instruction file.

```ts
type AddToolOptions = {
  description: string
  directory: string
  discovered: Set<string>
}

// args
{
  rules: string  // JSON matching FormatResponseSchema
  file?: string  // target file path
  mode?: string  // verbose, balanced (default), or concise
}

// execute
// 1. Guard: discovered.size === 0 -> error
// 2. validateJson(args.rules, FormatResponseSchema)
// 3. Resolve file path: args.file or first discovered file
// 4. appendRules({ filePath, rules: validated.data.rules })
// 5. Return "Added N rule(s) to path"
```

No changes needed. Already matches spec.

### createParsePromptTool

Validates ParsedPrompt JSON from the LLM.

```ts
type ParsePromptToolOptions = {
  description: string
}

// args
{
  tasks: string  // JSON matching ParsedPromptSchema ({ tasks: ParsedTask[] })
}

// execute
// 1. validateJson(args.tasks, ParsedPromptSchema)
// 2. Return JSON.stringify(validated.data, null, 2)
// 3. On error, return formatValidationError(validated)
```

No changes needed. Already matches spec.

### createFormatPromptTool

Renders validated tasks into a markdown tree.

```ts
type FormatPromptToolOptions = {
  description: string
}

// args
{
  tasks: string  // JSON matching ParsedPromptSchema
}

// execute
// 1. validateJson(args.tasks, ParsedPromptSchema)
// 2. formatPrompt(validated.data) -> tree string
// 3. Return tree string, or "No tasks found" if empty
```

No changes needed. Already matches spec.

## rewrite.ts (write rules to file)

```ts
type ProcessFileOptions = {
  file: InstructionFile    // from discover.ts
  rules: Array<string>     // formatted rule strings from LLM
}

// processFile(options) -> FileResult
// 1. If file.error, return { status: 'readError', path, error }
// 2. Join rules with "\n\n", append trailing "\n"
// 3. writeFile(file.path, content)
// 4. compareBytes(basename, original, content) -> ComparisonResult
// 5. Return { status: 'success', path, rulesCount, comparison }
```

No changes needed. Already matches spec.

## append.ts (append rules to file)

```ts
type AppendRulesOptions = {
  filePath: string
  rules: Array<string>     // formatted rule strings from LLM
}

// appendRules(options) -> AppendResult
// 1. readFile(filePath) -> existing content
// 2. Join rules with "\n\n", append trailing "\n"
// 3. computeSeparator(existing) -> "" or "\n" or "\n\n"
// 4. content = existing + separator + formatted
// 5. writeFile(filePath, content)
// 6. Return { status: 'success', path, rulesCount }

// computeSeparator(existing)
// - empty string -> ""
// - ends with "\n\n" -> ""
// - ends with "\n" -> "\n"
// - otherwise -> "\n\n"
```

No changes needed. Already matches spec.

## rule-schema.ts

Exports used by tools:

- `ParsedSchema` - z.array(ParsedRuleSchema), the raw array of parsed rules
- `ParseResponseSchema` - z.object({ rules: ParsedSchema }), validated by parse-rules
- `FormatResponseSchema` - z.object({ rules: z.array(RuleSchema) }), validated by format-rules, rewrite-rules, add-rules
- `parseSchemaExample` - JSON string for parse-rules arg description
- `formatSchemaExample` - JSON string for format-rules arg description

Both parse-rules and format-rules use the `{ "rules": [...] }` wrapper for consistency.

## sat.ts

Registers 7 tools. Imports creators from tools/ directory.

```ts
import { createParsePromptTool, createFormatPromptTool } from './src/tools/prompts.ts'
import {
  createAddTool,
  createDiscoverTool,
  createFormatRulesTool,
  createParseRulesTool,
  createRewriteTool,
} from './src/tools/rules.ts'
```

No changes needed except the ParseResponseSchema fix above may affect the import in tools.ts.

## Dependencies Between Tools (via output -> input)

### Rules pipeline

```
discover-rules
  output: markdown sections with file contents
  |
  v
parse-rules
  input: { "rules": [ParsedRule, ...] }  (LLM parses markdown into this)
  output: validated JSON (same shape, pretty-printed)
  |
  v
format-rules
  input: { "rules": ["Rule: ...\nReason: ...", ...] }  (LLM converts parsed rules to natural language)
  output: validated JSON (same shape, pretty-printed)
  |
  v
rewrite-rules / add-rules
  input: { "rules": ["Rule: ...\nReason: ...", ...] }  (LLM passes format-rules output directly)
  output: comparison table / confirmation message
```

### Prompt pipeline

```
parse-prompt
  input: { "tasks": [ParsedTask, ...] }  (LLM decomposes user input into this)
  output: validated JSON (same shape, pretty-printed)
  |
  v
format-prompt
  input: { "tasks": [ParsedTask, ...] }  (LLM passes parse-prompt output directly)
  output: rendered markdown tree (via formatPrompt from format-prompt.ts)
```

## File Output Format

### Instruction files (rewrite-rules / add-rules)

Rules joined with "\n\n", trailing "\n":

```
Rule: use early returns over if-else statements
Reason: To reduce nesting and improve readability.

Rule: do not use non-null assertions
Reason: Use narrowing type guards instead.
```

### Prompt tree (format-prompt)

Rendered by formatPrompt() in format-prompt.ts. Single task:

```
1. Fix type errors in utils
  > Targets: src/utils
  > Constraints: Run tests after
```

Multiple tasks use tree connectors (pipes, corners, tees).

## Changes Summary

1. Delete `src/format.ts` and `src/format.test.ts`
2. Fix `parse-rules` to validate against `ParseResponseSchema` instead of `ParsedSchema`
3. Update `PARSE_RULES_DESC` in tools.ts to show `{ "rules": [...] }` wrapper
4. Add `mode` optional parameter to `format-rules`, `rewrite-rules`, and `add-rules` tools
5. Update `sat.ts` tool descriptions to mention mode (verbose, balanced, concise)
6. Rewrite `append.test.ts` for new API (rules are strings, no mode at append level)
7. Update `README.md` to reflect new 7-tool pipeline with modes
8. Run dprint fmt, bun test, tsc --noEmit
