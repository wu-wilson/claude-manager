/**
 * Modal for moving or copying an entity to a different directory.
 * Displays a simple destination path input and preview.
 */

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { copyFile, moveFile, copyDirectory, deleteEntry } from '../../lib/fs/operations';
import { useAppStore } from '../../store';
import { useFileSystem } from '../../hooks/useFileSystem';
import { splitPath, cn } from '../../lib/utils';
import type { ConfigEntity } from '../../types';

interface MoveCopyModalProps {
  entity: ConfigEntity;
  onClose: () => void;
}

/**
 * Allows the user to copy or move an entity to a new path within the opened directory.
 * For skills (directories), uses copyDirectory + deleteEntry({ recursive: true }).
 *
 * @param entity - The entity to move or copy.
 * @param onClose - Called when the modal is dismissed.
 */
export function MoveCopyModal({ entity, onClose }: MoveCopyModalProps) {
  const { rootHandle } = useAppStore();
  const { rescan } = useFileSystem();

  const [operation, setOperation] = useState<'copy' | 'move'>('copy');
  const [destPath, setDestPath] = useState(() => {
    // Default destination: same directory with "-copy" suffix
    const { dir, filename } = splitPath(entity.relativePath);
    const base = filename.replace(/\.md$/, '');
    return dir ? `${dir}/${base}-copy.md` : `${base}-copy.md`;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  /**
   * Navigates a path string like "a/b/c" within the root handle,
   * creating directories as needed.
   *
   * @param pathStr - Slash-separated directory path.
   * @returns The directory handle at the end of the path.
   */
  async function resolveDirPath(pathStr: string): Promise<FileSystemDirectoryHandle> {
    if (!rootHandle) throw new Error('No root directory open');
    const parts = pathStr.split('/').filter(Boolean);
    let current = rootHandle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    return current;
  }

  /**
   * Executes the copy or move operation, then rescans and closes.
   */
  async function handleExecute() {
    if (!rootHandle) return;
    setIsRunning(true);
    setError(null);
    try {
      const { dir: destDir, filename: destFilename } = splitPath(destPath.trim());
      const destDirHandle = await resolveDirPath(destDir);

      if (entity.type === 'skill') {
        // Skills are directories — copy recursively then optionally remove source
        if (operation === 'copy') {
          await copyDirectory(entity.dirHandle, destDirHandle, destFilename);
        } else {
          await copyDirectory(entity.dirHandle, destDirHandle, destFilename);
          const { dir: srcParentPath } = splitPath(entity.relativePath);
          const { dir: srcGrandparentPath, filename: srcDirName } = splitPath(srcParentPath);
          const srcParent = await resolveDirPath(srcGrandparentPath);
          await deleteEntry(srcParent, srcDirName, true);
        }
      } else {
        if (operation === 'copy') {
          await copyFile(entity.fileHandle, destDirHandle, destFilename);
        } else {
          await moveFile(
            entity.fileHandle,
            entity.dirHandle,
            entity.relativePath.split('/').pop() ?? destFilename,
            destDirHandle,
            destFilename
          );
        }
      }

      await rescan(rootHandle);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="movecopy-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="relative z-10 bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 p-4 sm:p-6 max-w-md w-full flex flex-col gap-4 sm:gap-5"
      >
        <div className="flex items-center justify-between">
          <h2 id="movecopy-title" className="font-semibold text-slate-900 dark:text-zinc-100">
            Move / Copy
          </h2>
          <button
            onClick={onClose}
            className="focus-ring p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source info */}
        <p className="text-xs font-mono text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
          {entity.relativePath}
        </p>

        {/* Operation toggle */}
        <div className="flex rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden">
          {(['copy', 'move'] as const).map((op) => (
            <button
              key={op}
              onClick={() => setOperation(op)}
              className={cn(
                'flex-1 py-2 text-sm font-medium capitalize',
                'focus-ring transition-colors',
                operation === op
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              )}
              aria-pressed={operation === op}
            >
              {op}
            </button>
          ))}
        </div>

        {/* Destination path */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dest-path" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
            Destination path (relative to root)
          </label>
          <input
            id="dest-path"
            type="text"
            value={destPath}
            onChange={(e) => setDestPath(e.target.value)}
            className={cn(
              'px-3 py-2 text-sm font-mono rounded-lg',
              'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
              'text-slate-900 dark:text-zinc-100',
              'focus-ring'
            )}
          />
          <p className="text-xs text-slate-400 dark:text-zinc-600">
            Result: <code className="font-mono">{destPath || '(empty)'}</code>
          </p>
        </div>

        {error && (
          <div role="alert" className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
              'hover:bg-slate-200 dark:hover:bg-zinc-700',
              'focus-ring transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={isRunning || !destPath.trim()}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'focus-ring transition-colors'
            )}
          >
            {isRunning ? 'Working…' : operation === 'copy' ? 'Copy' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  );
}
