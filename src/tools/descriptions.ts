import { promptSchemaExample } from '../prompt-schema.ts'
import { formatSchemaExample, parseSchemaExample } from '../rule-schema.ts'

export const PARSE_RULES_DESC = [
  'Object with a "rules" array. Each rule: {',
  '  strength: obligatory|permissible|forbidden|optional|supererogatory|indifferent|omissible,',
  '  action: imperative verb describing what to do,',
  '  target: what the action applies to,',
  '  context: (optional) when/where the rule applies,',
  '  reason: why the rule exists',
  '}',
  'Example: ' + parseSchemaExample,
].join('\n')

export const MODE_DESC = [
  'Formatting mode: verbose, balanced, or concise.',
  '  verbose: Full Rule/Reason pairs for every rule.',
  '  balanced (default): The LLM decides which rules need reasons.',
  '  concise: Bullet list of directives only, no reasons.',
].join('\n')

export const FORMAT_RULES_DESC = [
  'Array of human-readable rule strings.',
  'Each string is a formatted rule derived from parsed components.',
  'Express the deontic strength naturally in the rule text:',
  '  obligatory -> "use consistent whitespace" (positive imperative)',
  '  forbidden -> "do not use non-null assertions" (negated imperative)',
  '  permissible -> "may use type assertions when necessary"',
  'For verbose and balanced modes, include "Rule: " prefix and "\\nReason: " suffix.',
  'For concise mode, use "- " prefix with no reason.',
  'Example: ' + formatSchemaExample,
].join('\n')

export const PARSE_PROMPT_DESC = [
  'Parsed prompt with array of tasks. Each task: {',
  '  intent: clear directive of what to do,',
  '  targets: files/systems involved (default []),',
  '  constraints: conditions/requirements (default []),',
  '  context: (optional) background rationale,',
  '  subtasks: nested tasks (default [])',
  '}',
  'Example: ' + promptSchemaExample,
].join('\n')
