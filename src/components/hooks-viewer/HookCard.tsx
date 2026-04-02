/**
 * Card component for displaying a single hook entry from settings.json.
 */

import { Zap, Edit2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { HookEntry } from '../../types';

interface HookCardProps {
  hook: HookEntry;
  /** Called when the user clicks the edit button to open the parent settings.json. */
  onEdit: () => void;
}

/** Badge colors per event type. */
const EVENT_COLORS: Record<string, string> = {
  PreToolUse: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PostToolUse: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  SessionStart: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SessionEnd: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  Stop: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  SubagentStop: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Notification: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  UserPromptSubmit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

/**
 * Renders a single hook entry with event type badge, matcher, handler preview, and edit button.
 *
 * @param hook - The hook entry to display.
 * @param onEdit - Callback to open the parent settings.json for editing.
 */
export function HookCard({ hook, onEdit }: HookCardProps) {
  const eventColor = EVENT_COLORS[hook.event] ?? 'bg-slate-100 text-slate-700';
  const handlerPreview =
    hook.handler.command ?? hook.handler.url ?? hook.handler.prompt ?? hook.handler.agent ?? '';

  return (
    <li
      role="listitem"
      className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Event type + handler type */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', eventColor)}>
            {hook.event}
          </span>
          <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">
            {hook.handler.type}
          </span>
          {hook.handler.async && (
            <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 px-1.5 py-0.5 rounded">
              async
            </span>
          )}
        </div>

        {/* Matcher */}
        {hook.matcher && (
          <p className="text-xs font-mono text-slate-500 dark:text-zinc-500 mt-1">
            matcher: <span className="text-slate-700 dark:text-zinc-300">{hook.matcher}</span>
          </p>
        )}

        {/* Handler preview */}
        {handlerPreview && (
          <p className="text-xs font-mono text-slate-400 dark:text-zinc-600 mt-0.5 truncate">
            {handlerPreview}
          </p>
        )}
      </div>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="focus-ring p-1.5 rounded-md text-slate-400 dark:text-zinc-600 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
        aria-label="Edit parent settings.json"
        title="Edit in settings.json"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
