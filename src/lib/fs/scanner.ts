/**
 * Scans a root FileSystemDirectoryHandle for all Claude Code configuration entities.
 * Produces a flat list of ConfigEntity objects by checking known paths.
 * Missing directories are handled gracefully — they return empty arrays, not errors.
 */

import { parseFrontmatter, extractName } from './frontmatter';
import { walkDirectory } from './operations';
import type { ConfigEntity, EntityType, HookEntry } from '../../types';

// --- Directory traversal helpers ---

/** A file entry found during a directory listing. */
interface FileEntry {
  name: string;
  handle: FileSystemFileHandle;
  dirHandle: FileSystemDirectoryHandle;
}

/**
 * Attempts to list all files in a nested directory path beneath the given root.
 * Returns an empty array (rather than throwing) if any segment of the path
 * does not exist — this is expected when a project hasn't set up every config dir.
 *
 * @param root - The root directory handle to navigate from.
 * @param pathParts - Directory names to traverse in order (e.g. '.claude', 'agents').
 * @returns An array of file entries, each with name, file handle, and parent dir handle.
 */
async function tryListDir(
  root: FileSystemDirectoryHandle,
  ...pathParts: string[]
): Promise<FileEntry[]> {
  try {
    let dir = root;
    for (const part of pathParts) {
      dir = await dir.getDirectoryHandle(part);
    }
    const results: FileEntry[] = [];
    for await (const [name, entry] of dir.entries()) {
      if (entry.kind === 'file') {
        results.push({ name, handle: entry as FileSystemFileHandle, dirHandle: dir });
      }
    }
    return results;
  } catch {
    return []; // directory doesn't exist — not an error
  }
}

/**
 * Attempts to get a single file at a known path.
 * Returns null (rather than throwing) if the file does not exist.
 *
 * @param root - The root directory to navigate from.
 * @param pathParts - Directory and file name segments in order.
 * @returns A file entry, or null if not found.
 */
async function tryGetFile(
  root: FileSystemDirectoryHandle,
  ...pathParts: string[]
): Promise<FileEntry | null> {
  try {
    let dir = root;
    for (let i = 0; i < pathParts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(pathParts[i]);
    }
    const filename = pathParts[pathParts.length - 1];
    const handle = await dir.getFileHandle(filename);
    return { name: filename, handle, dirHandle: dir };
  } catch {
    return null; // file doesn't exist — not an error
  }
}

// --- Entity builders ---

/**
 * Builds a stable entity ID from a relative path using base64 encoding.
 *
 * @param relativePath - The relative path string to encode.
 * @returns A base64-encoded string safe to use as a React key or URL segment.
 */
function makeId(relativePath: string): string {
  return btoa(relativePath);
}

/**
 * Reads a file, parses its frontmatter, and constructs a ConfigEntity.
 *
 * @param entry - The file entry with name, handle, and parent dir handle.
 * @param relativePath - The path relative to the root, used for display and ID.
 * @param type - The entity type to assign.
 * @param scope - Whether this belongs to the project or user config.
 * @returns A fully populated ConfigEntity.
 */
async function buildEntity(
  entry: FileEntry,
  relativePath: string,
  type: EntityType,
  scope: 'project' | 'user'
): Promise<ConfigEntity> {
  const file = await entry.handle.getFile();
  let frontmatter: Record<string, unknown> = {};

  if (type !== 'settings') {
    const raw = await file.text();
    frontmatter = parseFrontmatter(raw).data;
  } else {
    try {
      const raw = await file.text();
      frontmatter = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      frontmatter = {};
    }
  }

  return {
    id: makeId(relativePath),
    type,
    name: extractName(frontmatter, entry.name),
    relativePath,
    scope,
    fileHandle: entry.handle,
    dirHandle: entry.dirHandle,
    frontmatter,
    modifiedAt: file.lastModified,
  };
}

// --- Skill scanner (directory-based) ---

/**
 * Scans the .claude/skills/ directory for skill entities.
 * Each skill is a subdirectory containing a SKILL.md file.
 *
 * @param root - The root directory handle.
 * @returns An array of ConfigEntity objects for each skill found.
 */
async function scanSkills(root: FileSystemDirectoryHandle): Promise<ConfigEntity[]> {
  const results: ConfigEntity[] = [];
  try {
    const claudeDir = await root.getDirectoryHandle('.claude');
    const skillsDir = await claudeDir.getDirectoryHandle('skills');
    for await (const [skillName, skillEntry] of skillsDir.entries()) {
      if (skillEntry.kind !== 'directory') continue;
      const skillDir = skillEntry as FileSystemDirectoryHandle;
      try {
        const skillFileHandle = await skillDir.getFileHandle('SKILL.md');
        const relativePath = `.claude/skills/${skillName}/SKILL.md`;
        const file = await skillFileHandle.getFile();
        const raw = await file.text();
        const { data: frontmatter } = parseFrontmatter(raw);
        results.push({
          id: makeId(relativePath),
          type: 'skill',
          name: extractName(frontmatter, skillName),
          relativePath,
          scope: 'project',
          fileHandle: skillFileHandle,
          dirHandle: skillDir,
          frontmatter,
          modifiedAt: file.lastModified,
        });
      } catch {
        // Skill directory exists but has no SKILL.md — skip it
      }
    }
  } catch {
    // No .claude/skills directory — expected for many projects
  }
  return results;
}

// --- Hook entity synthesizer ---

/**
 * Synthesizes hook entities from the `hooks` array inside a parsed settings.json.
 * Each hook entry becomes a separate ConfigEntity of type 'hook' pointing back
 * to the parent settings file handle for editing.
 *
 * @param settingsEntity - The settings ConfigEntity whose frontmatter contains the hooks array.
 * @returns An array of ConfigEntity objects, one per hook entry.
 */
function synthesizeHookEntities(settingsEntity: ConfigEntity): ConfigEntity[] {
  const hooks = settingsEntity.frontmatter.hooks;
  if (!Array.isArray(hooks)) return [];

  return (hooks as HookEntry[]).map((hook, index) => {
    const hookPath = `${settingsEntity.relativePath}#hook[${index}]`;
    const eventLabel = hook.event ?? 'Unknown';
    const handlerLabel = hook.handler?.command ?? hook.handler?.url ?? hook.handler?.type ?? '';
    return {
      id: makeId(hookPath),
      type: 'hook' as EntityType,
      name: handlerLabel ? `${eventLabel}: ${handlerLabel}` : eventLabel,
      relativePath: hookPath,
      scope: settingsEntity.scope,
      fileHandle: settingsEntity.fileHandle,
      dirHandle: settingsEntity.dirHandle,
      frontmatter: hook as unknown as Record<string, unknown>,
      modifiedAt: settingsEntity.modifiedAt,
    };
  });
}

// --- Memory scanner ---

/**
 * Scans .claude/projects/{name}/memory/ for MEMORY.md and other .md files.
 *
 * @param root - The root directory handle.
 * @returns An array of ConfigEntity objects for memory files found.
 */
async function scanMemoryFiles(root: FileSystemDirectoryHandle): Promise<ConfigEntity[]> {
  const results: ConfigEntity[] = [];
  try {
    const claudeDir = await root.getDirectoryHandle('.claude');
    const projectsDir = await claudeDir.getDirectoryHandle('projects');
    for await (const [projectName, projectEntry] of projectsDir.entries()) {
      if (projectEntry.kind !== 'directory') continue;
      const projectDir = projectEntry as FileSystemDirectoryHandle;
      try {
        const memoryDir = await projectDir.getDirectoryHandle('memory');
        for await (const [fileName, fileEntry] of memoryDir.entries()) {
          if (fileEntry.kind !== 'file' || !fileName.endsWith('.md')) continue;
          const fileHandle = fileEntry as FileSystemFileHandle;
          const relativePath = `.claude/projects/${projectName}/memory/${fileName}`;
          const file = await fileHandle.getFile();
          const raw = await file.text();
          const { data: frontmatter } = parseFrontmatter(raw);
          results.push({
            id: makeId(relativePath),
            type: 'memory',
            name: extractName(frontmatter, fileName),
            relativePath,
            scope: 'user',
            fileHandle,
            dirHandle: memoryDir,
            frontmatter,
            modifiedAt: file.lastModified,
          });
        }
      } catch {
        // No memory dir in this project — expected
      }
    }
  } catch {
    // No .claude/projects directory
  }
  return results;
}

// --- CLAUDE.md scanner ---

/**
 * Scans for CLAUDE.md files at the root and inside .claude/.
 * Also walks the full tree looking for additional CLAUDE.md files in subdirectories.
 *
 * @param root - The root directory handle.
 * @returns An array of ConfigEntity objects for each CLAUDE.md found.
 */
async function scanClaudeMdFiles(root: FileSystemDirectoryHandle): Promise<ConfigEntity[]> {
  const results: ConfigEntity[] = [];
  const seen = new Set<string>();

  // Check root CLAUDE.md
  const rootEntry = await tryGetFile(root, 'CLAUDE.md');
  if (rootEntry) {
    const entity = await buildEntity(rootEntry, 'CLAUDE.md', 'claude_md', 'project');
    results.push(entity);
    seen.add('CLAUDE.md');
  }

  // Check .claude/CLAUDE.md
  const claudeEntry = await tryGetFile(root, '.claude', 'CLAUDE.md');
  if (claudeEntry) {
    const entity = await buildEntity(claudeEntry, '.claude/CLAUDE.md', 'claude_md', 'user');
    results.push(entity);
    seen.add('.claude/CLAUDE.md');
  }

  // Recursively walk for any additional CLAUDE.md files (skip node_modules, .git)
  try {
    for await (const entry of walkDirectory(root)) {
      if (
        entry.kind === 'file' &&
        entry.path.endsWith('CLAUDE.md') &&
        !seen.has(entry.path) &&
        !entry.path.includes('node_modules') &&
        !entry.path.includes('.git')
      ) {
        const fileHandle = entry.handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const raw = await file.text();
        const { data: frontmatter } = parseFrontmatter(raw);
        // Determine the parent dir handle by navigating the path
        const parts = entry.path.split('/');
        let dirHandle = root;
        try {
          for (let i = 0; i < parts.length - 1; i++) {
            dirHandle = await dirHandle.getDirectoryHandle(parts[i]);
          }
        } catch {
          dirHandle = root;
        }
        results.push({
          id: makeId(entry.path),
          type: 'claude_md',
          name: extractName(frontmatter, 'CLAUDE.md'),
          relativePath: entry.path,
          scope: 'project',
          fileHandle,
          dirHandle,
          frontmatter,
          modifiedAt: file.lastModified,
        });
        seen.add(entry.path);
      }
    }
  } catch {
    // Walk failed — use what we found
  }

  return results;
}

// --- Main scanner ---

/**
 * Scans a root directory handle for all Claude Code configuration entities.
 * Checks all known paths for agents, skills, commands, settings, hooks, memories, and CLAUDE.md files.
 * Missing directories are silently skipped.
 *
 * @param root - The opened root FileSystemDirectoryHandle.
 * @returns A flat array of all ConfigEntity objects found.
 */
export async function scanConfigEntities(
  root: FileSystemDirectoryHandle
): Promise<ConfigEntity[]> {
  const entities: ConfigEntity[] = [];

  // Agents: .claude/agents/*.md
  const agentFiles = await tryListDir(root, '.claude', 'agents');
  for (const entry of agentFiles.filter((e) => e.name.endsWith('.md'))) {
    const entity = await buildEntity(entry, `.claude/agents/${entry.name}`, 'agent', 'project');
    entities.push(entity);
  }

  // Skills: .claude/skills/*/SKILL.md
  const skills = await scanSkills(root);
  entities.push(...skills);

  // Commands: .claude/commands/*.md
  const commandFiles = await tryListDir(root, '.claude', 'commands');
  for (const entry of commandFiles.filter((e) => e.name.endsWith('.md'))) {
    const entity = await buildEntity(
      entry,
      `.claude/commands/${entry.name}`,
      'command',
      'project'
    );
    entities.push(entity);
  }

  // Settings files
  const settingsPaths: Array<{ parts: string[]; relativePath: string }> = [
    { parts: ['.claude', 'settings.json'], relativePath: '.claude/settings.json' },
    {
      parts: ['.claude', 'settings.local.json'],
      relativePath: '.claude/settings.local.json',
    },
  ];

  for (const { parts, relativePath } of settingsPaths) {
    const entry = await tryGetFile(root, ...parts);
    if (entry) {
      const entity = await buildEntity(entry, relativePath, 'settings', 'project');
      entities.push(entity);
      // Synthesize hook entities from this settings file
      const hookEntities = synthesizeHookEntities(entity);
      entities.push(...hookEntities);
    }
  }

  // Memory files
  const memoryEntities = await scanMemoryFiles(root);
  entities.push(...memoryEntities);

  // CLAUDE.md files
  const claudeMdEntities = await scanClaudeMdFiles(root);
  entities.push(...claudeMdEntities);

  return entities;
}
