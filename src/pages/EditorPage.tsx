/**
 * Full editor panel for a selected entity.
 * Shows CodeMirror editor, frontmatter sidebar, breadcrumb, and action buttons.
 */

import { useState } from 'react';
import { Save, Trash2, X, Move, SidebarOpen } from 'lucide-react';
import { CodeEditor } from '../components/editor/CodeEditor';
import { FrontmatterPanel } from '../components/editor/FrontmatterPanel';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { MoveCopyModal } from '../components/modals/MoveCopyModal';
import { useEntityFile } from '../hooks/useEntityFile';
import { useAppStore } from '../store';
import { deleteEntry } from '../lib/fs/operations';
import { cn } from '../lib/utils';

/**
 * Editor view for the currently selected entity.
 * Displayed as a sliding panel or full-page view based on app layout.
 */
export default function EditorPage() {
  const { selectedEntity, selectEntity, removeEntity } = useAppStore();
  const { content, isDirty, isLoading, error, setContent, save, discard } =
    useEntityFile(selectedEntity);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveCopy, setShowMoveCopy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFrontmatter, setShowFrontmatter] = useState(false);

  if (!selectedEntity) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-zinc-600">
        <p className="text-sm">Select an entity to edit</p>
      </div>
    );
  }

  /** The language mode to use in CodeMirror. */
  const language = selectedEntity.type === 'settings' ? 'json' : 'markdown';

  /**
   * Saves the current content to disk.
   * Shows an error toast if the save fails.
   */
  async function handleSave() {
    setSaveError(null);
    try {
      await save();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  /**
   * Deletes the entity file from disk and removes it from the store.
   */
  async function handleDelete() {
    if (!selectedEntity) return;
    const filename = selectedEntity.relativePath.split('/').pop() ?? selectedEntity.name;
    await deleteEntry(selectedEntity.dirHandle, filename, selectedEntity.type === 'skill');
    removeEntity(selectedEntity.id);
    setShowDeleteConfirm(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => selectEntity(null)}
            className="focus-ring p-1 rounded text-slate-400 hover:text-slate-700 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Close editor"
          >
            <X className="w-4 h-4" />
          </button>
          <Breadcrumb relativePath={selectedEntity.relativePath} isDirty={isDirty} />
        </div>

        <div className="flex items-center gap-1">
          {/* Frontmatter toggle (icon-only on mobile) */}
          {language === 'markdown' && (
            <button
              onClick={() => setShowFrontmatter((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'focus-ring transition-colors',
                showFrontmatter
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              )}
              aria-label="Toggle frontmatter panel"
              aria-pressed={showFrontmatter}
              title="Toggle frontmatter panel"
            >
              <SidebarOpen className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move/Copy */}
          <button
            onClick={() => setShowMoveCopy(true)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800',
              'focus-ring transition-colors'
            )}
            aria-label="Move or copy this file"
            title="Move / Copy"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Move/Copy</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
              'focus-ring transition-colors'
            )}
            aria-label="Delete this file"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          {/* Discard */}
          {isDirty && (
            <button
              onClick={discard}
              className={cn(
                'hidden sm:block px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800',
                'focus-ring transition-colors'
              )}
              aria-label="Discard changes"
            >
              Discard
            </button>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus-ring transition-colors'
            )}
            aria-label="Save file (Ctrl+S)"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Error display */}
      {(error || saveError) && (
        <div role="alert" className="px-4 py-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          {error || saveError}
        </div>
      )}

      {/* Editor + frontmatter panel */}
      <div className="flex-1 flex min-h-0">
        {/* CodeMirror */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-zinc-600 text-sm">
              Loading…
            </div>
          ) : (
            <CodeEditor
              value={content}
              onChange={setContent}
              language={language}
              onSave={handleSave}
            />
          )}
        </div>

        {/* Frontmatter panel — toggled via toolbar button, hidden by default */}
        {language === 'markdown' && showFrontmatter && (
          <div className="w-52 flex-shrink-0 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
            <FrontmatterPanel content={content} onContentChange={setContent} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this file?"
          description={`"${selectedEntity.relativePath}" will be permanently deleted from disk.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showMoveCopy && (
        <MoveCopyModal entity={selectedEntity} onClose={() => setShowMoveCopy(false)} />
      )}
    </div>
  );
}
