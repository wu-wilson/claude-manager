/**
 * Settings page — lists settings.json files and opens them in the editor.
 */

import { useAppStore } from '../store';
import { EntityCard } from '../components/entities/EntityCard';

/** Page listing .claude/settings.json and .claude/settings.local.json. */
export default function SettingsPage() {
  const { entities, selectEntity, selectedEntity } = useAppStore();

  const settingsEntities = entities.filter((e) => e.type === 'settings');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="font-semibold text-slate-900 dark:text-zinc-100">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
          JSON configuration files in <code className="font-mono">.claude/</code>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {settingsEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-zinc-600">
            <p className="text-sm">No settings files found.</p>
            <p className="text-xs mt-1">
              Create <code className="font-mono">.claude/settings.json</code> to configure Claude Code.
            </p>
          </div>
        ) : (
          <ul role="list" aria-label="Settings files">
            {settingsEntities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                isSelected={selectedEntity?.id === entity.id}
                onClick={selectEntity}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
