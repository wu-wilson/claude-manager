/**
 * All shared TypeScript types for the Claude Code Config Manager.
 * This file defines the core data shapes used throughout the application.
 */

// --- Entity types ---

/** The set of configuration entity types the scanner can discover. */
export type EntityType =
  | 'claude_md'
  | 'agent'
  | 'skill'
  | 'hook'
  | 'command'
  | 'settings'
  | 'memory';

/**
 * A single configuration entity discovered by the scanner.
 * Holds both the live file handle and parsed metadata needed to display and edit the entity.
 */
export interface ConfigEntity {
  /** Stable ID derived from btoa(relativePath). */
  id: string;
  /** The category of configuration entity. */
  type: EntityType;
  /** Display name: from frontmatter `name` field, or the filename. */
  name: string;
  /** Relative path from the opened root, e.g. ".claude/agents/reviewer.md". */
  relativePath: string;
  /** Whether this entity belongs to the project root or the user's home directory. */
  scope: 'project' | 'user';
  /** Live file handle for reading and writing the file. */
  fileHandle: FileSystemFileHandle;
  /** Parent directory handle, needed for delete and move operations. */
  dirHandle: FileSystemDirectoryHandle;
  /** Parsed YAML frontmatter as a plain object. Empty object if no frontmatter. */
  frontmatter: Record<string, unknown>;
  /** File.lastModified timestamp in milliseconds. */
  modifiedAt: number;
}

// --- Hook types ---

/** Supported Claude Code hook event types. */
export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Stop'
  | 'SubagentStop'
  | 'Notification'
  | 'UserPromptSubmit';

/** A single hook handler definition as stored in settings.json. */
export interface HookHandler {
  type: 'command' | 'http' | 'prompt' | 'agent';
  command?: string;
  url?: string;
  prompt?: string;
  agent?: string;
  async?: boolean;
}

/** A hook entry as found in the settings.json `hooks` array. */
export interface HookEntry {
  event: HookEvent;
  matcher?: string;
  handler: HookHandler;
}

// --- Settings types ---

/** Structure of .claude/settings.json. */
export interface ClaudeSettings {
  model?: string;
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  mcpServers?: Record<string, unknown>;
  hooks?: HookEntry[];
  [key: string]: unknown;
}

// --- Scanner result ---

/** Result of a full directory scan. */
export interface ScanResult {
  entities: ConfigEntity[];
  scannedAt: number;
}
