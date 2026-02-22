# SAT Tool Pipeline Spec

## Overview

SAT provides 7 tools organized into two pipelines: rules and prompts. Every pipeline follows the same pattern: parse structured data, format it, then write it. The LLM drives each step by calling tools sequentially, passing the output of one tool as input to the next.

## Tools

### 1. discover-rules

Reads instruction files from the project.

- **Input**: `files?` (string) - comma-separated file paths, or omit to auto-discover from opencode.json
- **Output**: Markdown sections with file paths and their contents
- **Side effect**: Populates the internal `discovered` set (required before rewrite-rules or add-rules)

```
Input:  (none)
Output: ## /path/to/instructions.md\n\nRule: use early returns\nReason: ...
```

### 2. parse-rules

Validates structured rule data parsed by the LLM.

- **Input**: `rules` (string) - JSON string of parsed rules matching ParsedSchema
- **Output**: Validated JSON (pretty-printed) or validation error
- **Schema**:

```json
{
  "rules": [
    {
      "strength": "obligatory|forbidden|permissible|optional|supererogatory|indifferent|omissible",
      "action": "imperative verb (e.g. use, prefer, split)",
      "target": "what the action applies to",
      "context": "(optional) when/where the rule applies",
      "reason": "why the rule exists"
    }
  ]
}
```

### 3. format-rules

Validates human-readable rule strings formatted by the LLM.

- **Input**: `rules` (string) - JSON string of formatted rules matching FormatResponseSchema, `mode?` (string) - verbose, balanced (default), or concise
- **Output**: Validated JSON (pretty-printed) or validation error
- **Modes**:
  - **verbose**: Full Rule/Reason pairs for every rule.
  - **balanced** (default): The LLM decides which rules need reasons.
  - **concise**: Bullet list of directives only, no reasons.
- **Schema**:

```json
{
  "rules": [
    "Rule: do not use non-null assertions\nReason: Use narrowing type guards instead."
  ]
}
```

### 4. rewrite-rules

Writes formatted rule strings to instruction files, replacing all existing content.

- **Input**: `rules` (string) - JSON string matching FormatResponseSchema, `files?` (string) - comma-separated file paths, `mode?` (string) - verbose, balanced (default), or concise
- **Output**: Comparison table showing file sizes before/after
- **Requires**: discover-rules must be called first

### 5. add-rules

Appends formatted rule strings to an instruction file without overwriting.

- **Input**: `rules` (string) - JSON string matching FormatResponseSchema, `file?` (string) - target file path, `mode?` (string) - verbose, balanced (default), or concise
- **Output**: Confirmation message with count of rules added
- **Requires**: discover-rules must be called first

### 6. parse-prompt

Validates structured task data parsed by the LLM.

- **Input**: `tasks` (string) - JSON string of parsed tasks matching ParsedPromptSchema
- **Output**: Validated JSON (pretty-printed) or validation error
- **Schema**:

```json
{
  "tasks": [
    {
      "intent": "clear directive of what to do",
      "targets": ["files/systems involved"],
      "constraints": ["conditions/requirements"],
      "context": "(optional) background rationale",
      "subtasks": []
    }
  ]
}
```

### 7. format-prompt

Renders validated tasks into a formatted markdown tree view.

- **Input**: `tasks` (string) - JSON string matching ParsedPromptSchema
- **Output**: Rendered markdown tree or validation error

## Pipelines

### Rules: Rewrite

Rewrites all instruction file content with freshly formatted rules.

```
discover-rules -> parse-rules -> format-rules -> rewrite-rules
```

| Step | Tool | LLM's job | Tool's job | Output |
|------|------|-----------|------------|--------|
| 1 | discover-rules | Call the tool | Read files from opencode.json | Markdown with file contents |
| 2 | parse-rules | Parse file content into ParsedSchema JSON | Validate against ParsedSchema | Validated ParsedRule JSON |
| 3 | format-rules | Convert ParsedRules into natural language strings expressing deontic strength, respecting the mode | Validate against FormatResponseSchema | Validated formatted rule strings |
| 4 | rewrite-rules | Pass formatted strings to tool | Write strings to instruction files | Comparison table |

#### Intermediate data between steps

**Step 1 output -> Step 2 input**

The LLM reads the markdown content returned by discover-rules and parses it into structured rules:

```
discover-rules returns:
  "## /path/to/instructions.md\n\nRule: use early returns\nReason: Reduces nesting."

LLM produces for parse-rules:
  {"rules":[{"strength":"obligatory","action":"use","target":"early returns","reason":"Reduces nesting."}]}
```

**Step 2 output -> Step 3 input**

The LLM reads the validated ParsedRule JSON and converts each rule into a human-readable string, expressing deontic strength naturally. The mode controls the output style:

```
parse-rules returns:
  {"rules":[{"strength":"forbidden","action":"use","target":"non-null assertions","reason":"Use narrowing type guards instead."}]}

LLM produces for format-rules (verbose mode):
  {"rules":["Rule: do not use non-null assertions\nReason: Use narrowing type guards instead."]}

LLM produces for format-rules (concise mode):
  {"rules":["- do not use non-null assertions"]}
```

Deontic strength mapping:
- obligatory -> positive imperative: "use consistent whitespace"
- forbidden -> negated imperative: "do not use non-null assertions"
- permissible -> "may use type assertions when necessary"
- optional -> "optionally include context"
- supererogatory -> "ideally document all public APIs"

**Step 3 output -> Step 4 input**

The LLM passes the validated formatted strings directly to rewrite-rules:

```
format-rules returns:
  {"rules":["Rule: do not use non-null assertions\nReason: Use narrowing type guards instead."]}

LLM passes same value to rewrite-rules:
  {"rules":["Rule: do not use non-null assertions\nReason: Use narrowing type guards instead."]}
```

### Rules: Add

Appends new rules to an existing instruction file.

```
discover-rules -> parse-rules -> format-rules -> add-rules
```

Identical to the rewrite pipeline except step 4 uses add-rules (append) instead of rewrite-rules (overwrite).

### Prompt: Refine

Restructures messy user input into a formatted task tree.

```
parse-prompt -> format-prompt
```

| Step | Tool | LLM's job | Tool's job | Output |
|------|------|-----------|------------|--------|
| 1 | parse-prompt | Decompose user input into ParsedPromptSchema JSON | Validate against ParsedPromptSchema | Validated task JSON |
| 2 | format-prompt | Pass validated JSON to tool | Render task tree as markdown | Formatted markdown tree |

#### Intermediate data between steps

**Step 1 output -> Step 2 input**

The LLM passes the validated task JSON directly to format-prompt:

```
parse-prompt returns:
  {"tasks":[{"intent":"Fix type errors in utils","targets":["src/utils"],"constraints":["Run tests after"],"context":"","subtasks":[]}]}

LLM passes same value to format-prompt:
  {"tasks":[{"intent":"Fix type errors in utils","targets":["src/utils"],"constraints":["Run tests after"],"context":"","subtasks":[]}]}
```

## Final output format

### Instruction files (rewrite-rules / add-rules)

Rules are written as plain text, separated by double newlines, with a trailing newline. The format depends on the mode:

**verbose** - Full Rule/Reason pairs for every rule.

```
Rule: use early returns over if-else statements
Reason: To reduce nesting and improve readability by handling edge cases first.

Rule: do not use non-null assertions
Reason: Use narrowing type guards to verify values before accessing them.

Rule: do not use ternaries unless used for simple const or object assignment
Reason: To keep conditional logic readable and explicit.
```

**balanced** (default) - The LLM decides which rules need reasons.

```
Rule: use early returns over if-else statements
Reason: To reduce nesting and improve readability by handling edge cases first.

Rule: do not use non-null assertions
Reason: Use narrowing type guards to verify values before accessing them.

Rule: do not use ternaries unless used for simple const or object assignment
```

**concise** - Bullet list of directives only, no reasons.

```
- use early returns over if-else statements
- do not use non-null assertions
- do not use ternaries unless used for simple const or object assignment
```

### Prompt tree (format-prompt)

Tasks are rendered as an indented tree with metadata:

```
1. Fix type errors in utils
   > Targets: src/utils
   > Constraints: Run tests after
```
