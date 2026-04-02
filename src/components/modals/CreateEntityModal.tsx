/**
 * Modal for creating new agents, skills, commands, or CLAUDE.md files.
 * Writes the appropriate file(s) into the opened directory and rescans.
 */

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createFile, createDirectory } from '../../lib/fs/operations';
import { stringifyFrontmatter } from '../../lib/fs/frontmatter';
import { useAppStore } from '../../store';
import { useFileSystem } from '../../hooks/useFileSystem';
import { cn, slugify } from '../../lib/utils';

type EntityCreationType = 'agent' | 'skill' | 'command' | 'claude_md';

const AVAILABLE_TOOLS = [
  'Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob',
  'WebFetch', 'TodoRead', 'TodoWrite',
];

const AVAILABLE_MODELS = ['sonnet', 'haiku', 'opus'];

interface CreateEntityModalProps {
  /** The entity type to create. */
  type: EntityCreationType;
  onClose: () => void;
}

/**
 * Creates a new entity of the specified type by writing files to the open directory.
 * After creation, triggers a rescan so the new entity appears in the list.
 *
 * @param type - The type of entity to create.
 * @param onClose - Callback to close the modal.
 */
export function CreateEntityModal({ type, onClose }: CreateEntityModalProps) {
  const { rootHandle } = useAppStore();
  const { rescan } = useFileSystem();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [model, setModel] = useState('sonnet');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = modal!.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, []);

  /**
   * Toggles a tool in the selectedTools list.
   *
   * @param tool - The tool name to toggle.
   */
  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  /**
   * Builds the initial content string for a new agent .md file.
   *
   * @returns A markdown string with YAML frontmatter.
   */
  function buildAgentContent(): string {
    const fm: Record<string, unknown> = {
      name,
      description,
      model,
    };
    if (selectedTools.length > 0) fm.tools = selectedTools;
    return stringifyFrontmatter(fm, `\nYou are ${name}.\n\n${description}\n`);
  }

  /**
   * Builds the initial content string for a new skill SKILL.md file.
   *
   * @returns A markdown string with YAML frontmatter.
   */
  function buildSkillContent(): string {
    return stringifyFrontmatter(
      { name, description },
      `\n## ${name}\n\n${description}\n`
    );
  }

  /**
   * Builds the initial content string for a new command .md file.
   *
   * @returns A markdown string with YAML frontmatter.
   */
  function buildCommandContent(): string {
    return stringifyFrontmatter(
      { name, description },
      `\n## ${name}\n\n${description}\n`
    );
  }

  /** Starter template for a new CLAUDE.md file. */
  const CLAUDE_MD_TEMPLATE = `# Project Notes\n\nAdd project-specific instructions for Claude here.\n\n## Architecture\n\n## Key Commands\n\n## Code Standards\n`;

  /**
   * Creates the entity files and triggers a rescan.
   */
  async function handleCreate() {
    if (!rootHandle || !name.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const slug = slugify(name.trim());

      if (type === 'agent') {
        const agentsDir = await rootHandle
          .getDirectoryHandle('.claude', { create: true })
          .then((d) => d.getDirectoryHandle('agents', { create: true }));
        await createFile(agentsDir, `${slug}.md`, buildAgentContent());
      } else if (type === 'skill') {
        const skillsDir = await rootHandle
          .getDirectoryHandle('.claude', { create: true })
          .then((d) => d.getDirectoryHandle('skills', { create: true }));
        const skillDir = await createDirectory(skillsDir, slug);
        await createFile(skillDir, 'SKILL.md', buildSkillContent());
      } else if (type === 'command') {
        const commandsDir = await rootHandle
          .getDirectoryHandle('.claude', { create: true })
          .then((d) => d.getDirectoryHandle('commands', { create: true }));
        await createFile(commandsDir, `${slug}.md`, buildCommandContent());
      } else if (type === 'claude_md') {
        await createFile(rootHandle, 'CLAUDE.md', CLAUDE_MD_TEMPLATE);
      }

      await rescan(rootHandle);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity');
    } finally {
      setIsCreating(false);
    }
  }

  const TITLES: Record<EntityCreationType, string> = {
    agent: 'New Agent',
    skill: 'New Skill',
    command: 'New Command',
    claude_md: 'New CLAUDE.md',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-dialog-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="relative z-10 bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 p-4 sm:p-6 max-w-md w-full flex flex-col gap-4 sm:gap-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="create-dialog-title" className="font-semibold text-slate-900 dark:text-zinc-100">
            {TITLES[type]}
          </h2>
          <button
            onClick={onClose}
            className="focus-ring p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Fields */}
        {type !== 'claude_md' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="entity-name" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="entity-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'agent' ? 'e.g. code-reviewer' : 'e.g. my-skill'}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg',
                  'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
                  'text-slate-900 dark:text-zinc-100 placeholder:text-slate-400',
                  'focus-ring'
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="entity-desc" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="entity-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what this entity does…"
                className={cn(
                  'px-3 py-2 text-sm rounded-lg resize-none',
                  'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
                  'text-slate-900 dark:text-zinc-100 placeholder:text-slate-400',
                  'focus-ring'
                )}
              />
            </div>
          </>
        )}

        {/* Agent-specific fields */}
        {type === 'agent' && (
          <>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Tools</p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TOOLS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-mono font-medium',
                      'focus-ring transition-colors',
                      selectedTools.includes(tool)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    )}
                    aria-pressed={selectedTools.includes(tool)}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-model" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Model
              </label>
              <select
                id="agent-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg',
                  'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
                  'text-slate-900 dark:text-zinc-100',
                  'focus-ring'
                )}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* claude_md note */}
        {type === 'claude_md' && (
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Creates a <code className="font-mono text-xs">CLAUDE.md</code> file in the root of your
            opened directory with a starter template.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
              'hover:bg-slate-200 dark:hover:bg-zinc-700',
              'focus-ring transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || (type !== 'claude_md' && !name.trim())}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'focus-ring transition-colors'
            )}
          >
            {isCreating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
