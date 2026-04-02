/**
 * Generic entity list view with search, filter, sort, and multi-select bulk delete.
 * Used by all entity type pages (agents, skills, commands, etc.).
 */

import { useState, useMemo } from 'react';
import { Search, Trash2, SortAsc, SortDesc } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { useAppStore } from '../../store';
import { deleteEntry } from '../../lib/fs/operations';
import { cn } from '../../lib/utils';
import type { EntityType } from '../../types';

interface EntityListProps {
  /** Entity type to display (used for filtering). */
  type: EntityType;
  /** Empty-state message when no entities of this type exist. */
  emptyMessage: string;
  /** Optional slot for "Create New" button rendered above the list. */
  createButton?: React.ReactNode;
}

type SortField = 'name' | 'modified';
type SortDir = 'asc' | 'desc';

/**
 * Renders a searchable, sortable list of config entities for a given type.
 * Supports multi-select and bulk delete.
 *
 * @param type - The entity type to show in this list.
 * @param emptyMessage - Shown when no matching entities exist.
 * @param createButton - Optional button to create a new entity.
 */
export function EntityList({ type, emptyMessage, createButton }: EntityListProps) {
  const { entities, selectedEntity, selectEntity, removeEntity } = useAppStore();

  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);

  // Filter to this entity type, excluding synthesized hook sub-entries from raw paths
  const typeEntities = useMemo(
    () =>
      entities.filter(
        (e) => e.type === type && !e.relativePath.includes('#hook')
      ),
    [entities, type]
  );

  // Apply search filter
  const filtered = useMemo(() => {
    if (!query.trim()) return typeEntities;
    const lower = query.toLowerCase();
    return typeEntities.filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.relativePath.toLowerCase().includes(lower)
    );
  }, [typeEntities, query]);

  // Apply sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a.modifiedAt - b.modifiedAt;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  /**
   * Toggles the sort direction, or switches sort field if a different field is selected.
   *
   * @param field - The field to sort by.
   */
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  /**
   * Updates the checked set when a card checkbox changes.
   *
   * @param id - The entity ID.
   * @param checked - New checked state.
   */
  function handleCheckedChange(id: string, checked: boolean) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /**
   * Deletes entities by ID after confirmation.
   * Calls deleteEntry for each, then removes them from the store.
   *
   * @param ids - Entity IDs to delete.
   */
  async function handleDelete(ids: string[]) {
    const toDelete = entities.filter((e) => ids.includes(e.id));
    for (const entity of toDelete) {
      const filename = entity.relativePath.split('/').pop() ?? entity.name;
      await deleteEntry(entity.dirHandle, filename, entity.type === 'skill');
      removeEntity(entity.id);
    }
    setCheckedIds(new Set());
    setDeleteTarget(null);
  }

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — wraps to two rows on small screens */}
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0">
        {/* Search — full width on its own row on xs */}
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className={cn(
              'w-full pl-8 pr-3 py-1.5 text-sm rounded-lg',
              'bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700',
              'text-slate-900 dark:text-zinc-100 placeholder:text-slate-400',
              'focus-ring'
            )}
            aria-label="Search entities"
          />
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSort('name')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'focus-ring transition-colors',
              sortField === 'name'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            )}
            aria-label="Sort by name"
          >
            Name
            {sortField === 'name' && <SortIcon className="w-3 h-3" />}
          </button>
          <button
            onClick={() => handleSort('modified')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'focus-ring transition-colors',
              sortField === 'modified'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            )}
            aria-label="Sort by last modified"
          >
            Modified
            {sortField === 'modified' && <SortIcon className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex-1" />

        {/* Bulk delete */}
        {checkedIds.size > 0 && (
          <button
            onClick={() => setDeleteTarget([...checkedIds])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus-ring transition-colors"
            aria-label={`Delete ${checkedIds.size} selected entities`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete </span>{checkedIds.size}
          </button>
        )}

        {createButton}
      </div>

      {/* Count */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800/60 text-xs text-slate-400 dark:text-zinc-600">
        {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
        {query && ` matching "${query}"`}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-zinc-600">
            <p className="text-sm">{query ? `No results for "${query}"` : emptyMessage}</p>
          </div>
        ) : (
          <ul role="list" aria-label="Entity list">
            {sorted.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                isSelected={selectedEntity?.id === entity.id}
                isChecked={checkedIds.has(entity.id)}
                onClick={selectEntity}
                onCheckedChange={handleCheckedChange}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Confirm delete dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.length} ${deleteTarget.length === 1 ? 'item' : 'items'}?`}
          description="This cannot be undone. The files will be permanently deleted from disk."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
