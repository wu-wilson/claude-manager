/**
 * Entity list page for commands (.claude/commands/*.md).
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EntityList } from '../components/entities/EntityList';
import { CreateEntityModal } from '../components/modals/CreateEntityModal';
import { cn } from '../lib/utils';

/** Page listing all discovered command entities. */
export default function CommandsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="font-semibold text-slate-900 dark:text-zinc-100">Commands</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
          Custom slash commands in <code className="font-mono">.claude/commands/</code>
        </p>
      </div>

      <EntityList
        type="command"
        emptyMessage="No commands found. Create one to get started."
        createButton={
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'focus-ring transition-colors'
            )}
            aria-label="Create new command"
          >
            <Plus className="w-3.5 h-3.5" />
            New Command
          </button>
        }
      />

      {showCreate && (
        <CreateEntityModal type="command" onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
