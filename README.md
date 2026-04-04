## ⚡ Overview

**Conductor** is a browser-based dashboard for managing Claude Code configuration files — agents, skills, hooks, commands, settings, and memory. All file I/O happens directly in the browser via the File System Access API.

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
git clone https://github.com/wu-wilson/conductor.git
cd conductor
```

#### 2. Start the app

```bash
./launch.sh
```

Open `http://localhost:5173` in **Chrome, Edge, or Opera**.

## 🌐 Browser Requirements

**Requires Chrome 86+, Edge 86+, or Opera 72+.** The File System Access API (`showDirectoryPicker`) is only supported in Chromium-based browsers.

- Chrome 86+: ✅ Supported
- Edge 86+: ✅ Supported
- Opera 72+: ✅ Supported
- Firefox: ❌ Not supported
- Safari: ❌ Not supported

## 🤖 Sub-Agents

Two Claude Code sub-agents are included in `.claude/agents/`:

- **`debugger`** — invoke with `@agent-debugger` when the scanner returns unexpected results, file reads/writes fail, or permission errors occur.
- **`validator`** — invoke with `@agent-validator` after modifying `scanner.ts`, `frontmatter.ts`, or any `fs/` primitive. Runs a full checklist of type safety, dead code, scanner correctness, write atomicity, and code quality.
