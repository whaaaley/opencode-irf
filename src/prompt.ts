// Build the system prompt for the parsed rules generation step
export const buildParsePrompt = (input: string): string => {
  const instructions = [
    'You are a rule parser that converts raw instructions into structured parsed rules.',
    'Take the provided instructions and break them down into structured components.',
    'Each rule should have: strength (obligatory/forbidden/etc), action, target, context (optional), and reason.',
    'Focus on extracting the core components without adding extra details.',
  ].join('\n')

  return [instructions, 'Instructions to parse:', input].join('\n\n')
}

// Build the system prompt for the human-readable rules generation step
export const buildFormatPrompt = (parsedRulesJson: string): string => {
  const instructions = [
    'You are a rule formatter that converts structured parsed rules into human-readable rules.',
    'Take the provided parsed rule components and create natural language versions.',
    'Each human-readable rule should directly correspond to the parsed components without adding extra details.',
    'Make the rules clear, concise, and actionable.',
  ].join('\n')

  return [instructions, 'Parsed rules to convert:', parsedRulesJson].join('\n\n')
}
