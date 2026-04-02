/**
 * General utility functions used across the application.
 * Covers class name merging, date formatting, path truncation, and entity helpers.
 */

import type { EntityType } from '../types';

// --- Class names ---

/**
 * Merges multiple class name strings, filtering out falsy values.
 * A lightweight alternative to clsx for simple cases.
 *
 * @param classes - Class name strings or falsy values to merge.
 * @returns A single space-separated class name string.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// --- Date formatting ---

/**
 * Formats a Unix millisecond timestamp as a relative or absolute date string.
 * Returns "just now" for timestamps within the last minute, relative time
 * for the last 24 hours, and a short date string otherwise.
 *
 * @param timestamp - A Unix timestamp in milliseconds (e.g. File.lastModified).
 * @returns A human-readable date string.
 */
export function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date(timestamp).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// --- Path helpers ---

/**
 * Truncates a relative path to a maximum number of characters, inserting an ellipsis
 * in the middle so both the beginning and end of the path remain visible.
 *
 * @param path - The full relative path string.
 * @param maxLength - Maximum character length before truncation. Defaults to 40.
 * @returns The original path if short enough, or a truncated version with "…" in the middle.
 */
export function truncatePath(path: string, maxLength = 40): string {
  if (path.length <= maxLength) return path;
  const half = Math.floor((maxLength - 1) / 2);
  return `${path.slice(0, half)}…${path.slice(-half)}`;
}

/**
 * Splits a relative path into its directory and filename components.
 *
 * @param relativePath - The full relative path (e.g. ".claude/agents/reviewer.md").
 * @returns An object with `dir` (parent path) and `filename` (last segment).
 */
export function splitPath(relativePath: string): { dir: string; filename: string } {
  const lastSlash = relativePath.lastIndexOf('/');
  if (lastSlash === -1) return { dir: '', filename: relativePath };
  return {
    dir: relativePath.slice(0, lastSlash),
    filename: relativePath.slice(lastSlash + 1),
  };
}

// --- Entity type metadata ---

/** Display label and color class for each entity type. */
const ENTITY_META: Record<
  EntityType,
  { label: string; colorClass: string; bgClass: string }
> = {
  agent: {
    label: 'Agent',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
  },
  skill: {
    label: 'Skill',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  hook: {
    label: 'Hook',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
  },
  command: {
    label: 'Command',
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
  },
  claude_md: {
    label: 'CLAUDE.md',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-100 dark:bg-rose-900/30',
  },
  settings: {
    label: 'Settings',
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-800/50',
  },
  memory: {
    label: 'Memory',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
};

/**
 * Returns the display label for an entity type.
 *
 * @param type - The entity type.
 * @returns A human-readable label string.
 */
export function entityLabel(type: EntityType): string {
  return ENTITY_META[type].label;
}

/**
 * Returns Tailwind color class for an entity type's text.
 *
 * @param type - The entity type.
 * @returns A Tailwind text color class string.
 */
export function entityColorClass(type: EntityType): string {
  return ENTITY_META[type].colorClass;
}

/**
 * Returns Tailwind background class for an entity type badge.
 *
 * @param type - The entity type.
 * @returns A Tailwind background color class string.
 */
export function entityBgClass(type: EntityType): string {
  return ENTITY_META[type].bgClass;
}

/**
 * Generates a safe slug from a display name for use as a filename.
 * Lowercases, replaces spaces and special chars with hyphens, trims hyphens.
 *
 * @param name - The display name to slugify.
 * @returns A filename-safe slug string.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
