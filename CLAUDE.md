# Conductor

## Project Purpose
A local-first, purely frontend dashboard for managing Claude Code configuration files —
CLAUDE.md files, sub-agents, skills, hooks, commands, and settings.
No backend. All file I/O uses the browser's File System Access API.

## Architecture
- Single Vite + React + TypeScript app — no backend, no monorepo
- File I/O: File System Access API (`showDirectoryPicker`, `FileSystemDirectoryHandle`)
- Handle persistence: `idb-keyval` stores the root directory handle in IndexedDB
- All filesystem logic lives in `src/lib/fs/`
- UI state: Zustand store in `src/store/index.ts`

## Key Commands
- `npm run dev` — start Vite dev server (open in Chrome or Edge)
- `npm run build` — production build
- `npm run typecheck` — tsc --noEmit

## Code Standards
- Strict TypeScript throughout — no `any`, use `unknown` + type guards
- Named exports only (no default exports except page components)
- Tailwind utility classes only — no custom CSS files
- All filesystem calls go through `src/lib/fs/operations.ts` — never call the raw API directly in components
- Always use `createWritable().close()` for writes — never write partial state
- All user-facing strings must be accessible (ARIA labels, roles, live regions)
- **Keep it lean** — no test files, no unused imports, no placeholder files
- **JSDoc on every function** — each function must have a comment describing what it does, its parameters (`@param`), and its return value (`@returns`)
- **Single responsibility** — each file has one clear purpose
- **Readable over clever** — prefer explicit variable names and clear control flow
- **Group related code** — within a file, group related functions with a short section comment

## Browser Requirement
Requires Chrome 86+ or Edge 86+. Shows a clear unsupported-browser message if
`'showDirectoryPicker' in window` is false.

## Agent Guidance
- Scanner issues or unexpected entity results: @agent-debugger
- After modifying scanner.ts or frontmatter.ts: @agent-validator
