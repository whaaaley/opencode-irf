Rule: append todo to the end of the todo list without acting on it when a todo is mentioned in chat
Reason: To capture todos without disrupting current work

Rule: start working on newly added todos immediately
Reason: To avoid interrupting the current task in progress

Rule: continue with whatever task is currently in progress when a new todo is added
Reason: To maintain focus on the current task

Rule: work through todos in list order
Reason: To ensure todos are completed sequentially

Rule: begin the next todo only after the current one is complete
Reason: To ensure each todo is fully completed before moving on

Rule: use a single options object function parameters when a function requires more than three parameters
Reason: To improve readability and maintainability of function signatures

Rule: define the type as a named type alias directly above the function definition options object for function parameters when using an options object for function parameters
Reason: To provide clear type documentation co-located with the function

Rule: prioritize small utility functions wherever necessary in the codebase
Reason: To promote modularity and reusability

Rule: use callbacks or dependency injection side effects if side effects are required
Reason: To manage side effects cleanly while maintaining testability

Rule: use complex types
Reason: To keep type definitions simple and readable

Rule: use non-null assertions
Reason: To verify values before accessing them using narrowing type guards instead

Rule: use excessive optional chaining
Reason: To ensure deliberate null/undefined checks using explicit guards and conditions so access patterns are clear and intentional

Rule: use em dashes
Reason: To maintain consistent, simple punctuation across all written content

Rule: use consistent whitespace for readability
Reason: Whitespace is critical for readability and inconsistent spacing makes code harder to scan

Rule: prefer early returns over if-else statements
Reason: To reduce nesting and improve readability by handling edge cases first

Rule: use ternaries, especially chained ternaries, unless used for simple const or object assignment
Reason: To keep conditional logic readable and explicit

Rule: split function parameters across multiple lines
Reason: To keep function signatures compact and scannable on a single line

Rule: split onto multiple lines object literals or functions with three or more fields or parameters
Reason: One or two fields on a single line is fine, but three or more becomes hard to scan and should be expanded for readability

Rule: use an array with join string concatenation when string concatenation with plus signs would exceed 120 characters
Reason: To allow multi-line formatting that the formatter will not collapse back into a single line

Rule: complete the easiest tasks first todo list items when working through a todo list
Reason: To build momentum and reduce list size quickly before tackling complex items

Rule: delegate work to subagents or use the explore/task tool all work
Reason: To keep all context visible and avoid losing information to subagent boundaries

Rule: use discriminated unions with a shared literal field outcomes with distinct states like success and error when modeling outcomes with distinct states
Reason: Prevents invalid states and enables exhaustive narrowing

Rule: insert a blank line between the declaration and the if guard check on immediately preceding const/let when an if statement guards the variable declared in the immediately preceding const/let
Reason: The declaration and its guard check are logically coupled and should be visually grouped by touching

Rule: use dprint for formatting, not prettier code formatting
Reason: The project uses dprint as its code formatter

Rule: run bun run dprint fmt code when asked to format code
Reason: The project uses dprint as its code formatter

Rule: wrap expect statements inside tests with if statements test assertions
Reason: Conditional branches hide test failures silently; expect statements surface them

Rule: test each tool individually before testing them together plugin tools when testing plugin tools
Reason: To isolate issues and verify each tool works independently
