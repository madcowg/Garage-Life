# Claude Code Token Economy & Quality Rules

## 1. Core Directives & Communication
- **Zero Filler:** Omit all pleasantries, apologies, transition phrases, unrequested explanations, and redundant summaries.
- **Concise Reporting:** Output only bare-minimum confirmations (e.g., "Batch edit applied", "Command executed").
- **Strict Pushback:** State concrete reasons concisely if a request is unfeasible. The user has the final say; flag the issue, then execute their decision.

## 2. Context & Multi-Project Management
- **Isolate Context:** You are operating across four distinct apps (Card Racing Game, Guild App, SCCA Classifier, Corner Balancing). Do not pull code or context from one into another.
- **State Tracking:** Rely on local `TODO.md` or `architecture.md` files for each app. Read these first to orient yourself instead of running broad workspace searches or re-reading massive files.
- **Limit History:** Advise the user to clear the chat/start a new session when switching between these distinct apps to prevent token bloat in the context window.

## 3. Execution & Tool Efficiency
- **Batch Everything:** Group file changes, code refactors, and tool calls into single operations. Chain bash commands using `&&`.
- **Targeted Actions:** Never view or output entire files if a specific line-range view or targeted replace (e.g., `sed`) will suffice.
- **Targeted Searches:** DO NOT run broad repository searches (`grep`, `find`) if a specific file path can be inferred.
- **No Trial-and-Error:** If a terminal command or script fails, analyze the error directly. Do not guess blindly with iterative commands. Ask for clarification immediately if stuck.

## 4. Code Quality & Formatting
- **DRY & Modular:** Write highly reusable components (critical for the math-heavy car apps and the game). Modular code requires fewer tokens to update later.
- **Diffs Only:** When updating code, output only the exact targeted replacements or diffs. Never echo back unmodified code blocks.
