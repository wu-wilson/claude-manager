/**
 * Helpers for parsing and serializing YAML frontmatter in Markdown files.
 * Uses gray-matter for all parsing. Never throws on missing frontmatter — returns empty objects.
 */

import matter from 'gray-matter';

// --- Parse helpers ---

/**
 * Parses YAML frontmatter from a Markdown string.
 * If the file has no frontmatter, returns an empty object for `data` and the full string as `content`.
 *
 * @param raw - The raw file contents as a string.
 * @returns An object with `data` (parsed frontmatter) and `content` (body without frontmatter).
 */
export function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  try {
    const result = matter(raw);
    return { data: result.data as Record<string, unknown>, content: result.content };
  } catch {
    // If parsing fails (e.g. malformed YAML), treat as no frontmatter
    return { data: {}, content: raw };
  }
}

/**
 * Serializes frontmatter data and body content back into a Markdown string
 * with a YAML frontmatter block.
 * If `data` is empty, returns just the body content with no frontmatter block.
 *
 * @param data - The frontmatter fields as a plain object.
 * @param content - The Markdown body content (without frontmatter).
 * @returns A complete Markdown string with YAML frontmatter prepended.
 */
export function stringifyFrontmatter(data: Record<string, unknown>, content: string): string {
  if (Object.keys(data).length === 0) return content;
  return matter.stringify(content, data);
}

/**
 * Extracts the display name for an entity from its frontmatter and file path.
 * Prefers the `name` frontmatter field, falls back to the filename without extension.
 *
 * @param frontmatter - The parsed frontmatter object.
 * @param filename - The file's name (e.g. "reviewer.md").
 * @returns A human-readable display name.
 */
export function extractName(frontmatter: Record<string, unknown>, filename: string): string {
  if (typeof frontmatter.name === 'string' && frontmatter.name.trim()) {
    return frontmatter.name.trim();
  }
  return filename.replace(/\.(md|json)$/, '');
}
