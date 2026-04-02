## ⚡ Overview

**Claude Manager** is a browser-based dashboard for managing Claude Code configuration files — agents, skills, hooks, commands, settings, and memory. All file I/O happens directly in the browser via the File System Access API.

## 🚀 Stack

- React (TS)
- Tailwind CSS
- Vite
- Zustand
- CodeMirror 6
- File System Access API

## 🛠️ Local Setup

#### 1. Clone the repository

```bash
git clone <repo>
cd claude-manager
```

#### 2. Start the app

```bash
./launch.sh
```

Open `http://localhost:5173` in **Chrome or Edge**. Click "Open Home Directory" or "Open Project Directory" and select the directory you want to manage.

## 🌐 Browser Requirement

**Requires Chrome 86+ or Edge 86+.** The File System Access API (`showDirectoryPicker`) is fully supported in Chromium-based browsers.

- Chrome/Edge 86+: ✅ Full support
- Firefox: ⚠️ Behind a flag (`dom.fs.enabled` in `about:config`)
- Safari: ⚠️ Partial support as of 2025

## 📂 How Directory Scoping Works

The File System Access API never exposes absolute paths. The directory you open becomes the root:

- **Open your home directory (`~`)** — the app sees `~/.claude/` and manages your user-level agents, skills, settings, memory, and CLAUDE.md files.
- **Open a project directory** — the app sees `.claude/` inside that project and manages project-level configuration.

The active directory name is shown in the header. Use "Change Directory" to switch.

## 🔑 Key Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run typecheck  # Type-check without emitting
```

## 🤖 Sub-Agents

Two Claude Code sub-agents are included in `.claude/agents/`:

- **`debugger`** — invoke with `@agent-debugger` when the scanner returns unexpected results, file reads/writes fail, or permission errors occur.
- **`validator`** — invoke with `@agent-validator` after modifying `scanner.ts`, `frontmatter.ts`, or any `fs/` primitive. Runs a full checklist of type safety, dead code, scanner correctness, write atomicity, and code quality.

