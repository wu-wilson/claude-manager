/**
 * Entity list page for agents (.claude/agents/*.md).
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EntityList } from '../components/entities/EntityList';
import { CreateEntityModal } from '../components/modals/CreateEntityModal';
import { cn } from '../lib/utils';

/**
 * Page listing all discovered agent entities with create, search, sort, and delete.
 */
export default function AgentsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-slate-900 dark:text-zinc-100">Agents</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
            Sub-agents defined in <code className="font-mono">.claude/agents/</code>
          </p>
        </div>
      </div>

      <EntityList
        type="agent"
        emptyMessage="No agents found. Create one to get started."
        createButton={
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'focus-ring transition-colors'
            )}
            aria-label="Create new agent"
          >
            <Plus className="w-3.5 h-3.5" />
            New Agent
          </button>
        }
      />

      {showCreate && (
        <CreateEntityModal type="agent" onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
