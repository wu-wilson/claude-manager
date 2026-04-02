/**
 * Lists all hooks grouped by event type, derived from settings.json entities in the store.
 */

import { useMemo } from 'react';
import { HookCard } from './HookCard';
import { useAppStore } from '../../store';
import type { HookEvent, HookEntry } from '../../types';

const EVENT_ORDER: HookEvent[] = [
  'PreToolUse', 'PostToolUse', 'SessionStart', 'SessionEnd',
  'Stop', 'SubagentStop', 'Notification', 'UserPromptSubmit',
];

/**
 * Renders hooks grouped by event type.
 * Derives hook data from the settings entities in the store.
 * Clicking "Edit" on a hook opens the parent settings.json in the editor.
 */
export function HooksList() {
  const { entities, selectEntity } = useAppStore();

  // Build list of { hook, settingsEntity } pairs from synthesized hook entities
  const hookPairs = useMemo(() => {
    return entities
      .filter((e) => e.type === 'hook')
      .map((hookEntity) => ({
        hook: hookEntity.frontmatter as unknown as HookEntry,
        settingsEntityId: hookEntity.relativePath.split('#')[0],
        hookEntity,
      }));
  }, [entities]);

  // Group by event type
  const grouped = useMemo(() => {
    const map = new Map<string, typeof hookPairs>();
    for (const pair of hookPairs) {
      const event = pair.hook.event ?? 'Unknown';
      if (!map.has(event)) map.set(event, []);
      map.get(event)!.push(pair);
    }
    return map;
  }, [hookPairs]);

  if (hookPairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-zinc-600">
        <p className="text-sm">No hooks found in settings.json</p>
        <p className="text-xs mt-1">Add hooks to .claude/settings.json to see them here.</p>
      </div>
    );
  }

  /** Handles clicking "Edit" on a hook by opening the parent settings entity. */
  function handleEditHook(settingsPath: string) {
    const settingsEntity = entities.find((e) => e.relativePath === settingsPath);
    if (settingsEntity) selectEntity(settingsEntity);
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {EVENT_ORDER.filter((event) => grouped.has(event)).map((event) => (
        <div key={event}>
          <h3 className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-0">
            {event}
          </h3>
          <ul role="list" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {grouped.get(event)!.map((pair) => (
              <HookCard
                key={pair.hookEntity.id}
                hook={pair.hook}
                onEdit={() => handleEditHook(pair.settingsEntityId)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
