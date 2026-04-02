/**
 * Hooks viewer page — lists all hooks derived from settings.json, grouped by event type.
 */

import { HooksList } from '../components/hooks-viewer/HooksList';

/** Page displaying all Claude Code hooks found in settings.json files. */
export default function HooksPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="font-semibold text-slate-900 dark:text-zinc-100">Hooks</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
          Event hooks defined in <code className="font-mono">.claude/settings.json</code>
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <HooksList />
      </div>
    </div>
  );
}
