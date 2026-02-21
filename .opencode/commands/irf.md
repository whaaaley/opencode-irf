---
description: Parse project instruction files into structured rules using IRF
---

Call `irf-rewrite`. The tool handles everything internally:
1. Discovers instruction files from opencode.json
2. Parses each file into structured rules via internal LLM calls
3. Formats structured rules into human-readable text via internal LLM calls
4. Validates all outputs with retry on failure
5. Writes formatted rules back to the original files
