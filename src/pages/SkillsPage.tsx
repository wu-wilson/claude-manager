/**
 * Entity list page for skills (.claude/skills/{name}/SKILL.md).
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EntityList } from '../components/entities/EntityList';
import { CreateEntityModal } from '../components/modals/CreateEntityModal';
import { cn } from '../lib/utils';

/** Page listing all discovered skill entities. */
export default function SkillsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="font-semibold text-slate-900 dark:text-zinc-100">Skills</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
          Slash-command skills in <code className="font-mono">.claude/skills/</code>
        </p>
      </div>

      <EntityList
        type="skill"
        emptyMessage="No skills found. Create one to get started."
        createButton={
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'focus-ring transition-colors'
            )}
            aria-label="Create new skill"
          >
            <Plus className="w-3.5 h-3.5" />
            New Skill
          </button>
        }
      />

      {showCreate && (
        <CreateEntityModal type="skill" onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
