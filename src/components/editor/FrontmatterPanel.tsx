/**
 * Sidebar panel that renders parsed YAML frontmatter as editable fields.
 * Supports text inputs, tag arrays (e.g. `tools`), and model dropdowns.
 */

import { useMemo } from 'react';
import { parseFrontmatter, stringifyFrontmatter } from '../../lib/fs/frontmatter';
import { cn } from '../../lib/utils';

const AVAILABLE_TOOLS = [
  'Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob',
  'WebFetch', 'TodoRead', 'TodoWrite',
];

const AVAILABLE_MODELS = ['sonnet', 'haiku', 'opus'];

interface FrontmatterPanelProps {
  /** Full raw file content including frontmatter. */
  content: string;
  /** Called with the full updated content when a field changes. */
  onContentChange: (updated: string) => void;
}

/**
 * Parses frontmatter from the content and renders each key as an editable input.
 * Writes changes back by re-serializing the frontmatter and body together.
 *
 * @param content - The full raw markdown string including frontmatter.
 * @param onContentChange - Called with updated content when any frontmatter field changes.
 */
export function FrontmatterPanel({ content, onContentChange }: FrontmatterPanelProps) {
  const { data: fm, content: body } = useMemo(() => parseFrontmatter(content), [content]);

  if (Object.keys(fm).length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400 dark:text-zinc-600">
        No frontmatter detected
      </div>
    );
  }

  /**
   * Updates a single frontmatter key and emits the new full content.
   *
   * @param key - The frontmatter key to update.
   * @param value - The new value.
   */
  function updateField(key: string, value: unknown) {
    const updated = { ...fm, [key]: value };
    onContentChange(stringifyFrontmatter(updated, body));
  }

  /**
   * Toggles a string value in a tools-style array field.
   *
   * @param key - The frontmatter key holding the array.
   * @param item - The item to toggle.
   */
  function toggleArrayItem(key: string, item: string) {
    const current = Array.isArray(fm[key]) ? (fm[key] as string[]) : [];
    const next = current.includes(item)
      ? current.filter((t) => t !== item)
      : [...current, item];
    updateField(key, next.length > 0 ? next : undefined);
  }

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
      <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
        Frontmatter
      </p>

      {Object.entries(fm).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 capitalize">
            {key}
          </label>

          {/* Model dropdown */}
          {key === 'model' && (
            <select
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => updateField(key, e.target.value)}
              className={cn(
                'px-2 py-1.5 text-xs rounded-lg',
                'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
                'text-slate-900 dark:text-zinc-100',
                'focus-ring'
              )}
              aria-label={`${key} value`}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Tools tag list */}
          {key === 'tools' && (
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_TOOLS.map((tool) => {
                const selected = Array.isArray(value) && (value as string[]).includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleArrayItem(key, tool)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-mono font-medium',
                      'focus-ring transition-colors',
                      selected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    )}
                    aria-pressed={selected}
                  >
                    {tool}
                  </button>
                );
              })}
            </div>
          )}

          {/* Boolean */}
          {typeof value === 'boolean' && key !== 'tools' && key !== 'model' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateField(key, e.target.checked)}
                className="focus-ring rounded"
                aria-label={key}
              />
              <span className="text-xs text-slate-600 dark:text-zinc-400">{String(value)}</span>
            </label>
          )}

          {/* String input */}
          {typeof value === 'string' && key !== 'model' && (
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(key, e.target.value)}
              className={cn(
                'px-2 py-1.5 text-xs rounded-lg',
                'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
                'text-slate-900 dark:text-zinc-100',
                'focus-ring'
              )}
              aria-label={`${key} value`}
            />
          )}

          {/* Generic array (non-tools) */}
          {Array.isArray(value) && key !== 'tools' && (
            <p className="text-xs font-mono text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 rounded px-2 py-1">
              {JSON.stringify(value)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
