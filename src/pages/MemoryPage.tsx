/**
 * Entity list page for memory files (.claude/projects/{name}/memory/*.md).
 */

import { EntityList } from '../components/entities/EntityList';

/** Page listing all memory files found under .claude/projects/{name}/memory/. */
export default function MemoryPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="font-semibold text-slate-900 dark:text-zinc-100">Memory</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
          Memory files in <code className="font-mono">.claude/projects/*/memory/</code>
        </p>
      </div>

      <EntityList
        type="memory"
        emptyMessage="No memory files found."
      />
    </div>
  );
}
