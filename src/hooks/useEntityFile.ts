/**
 * Hook for reading and writing a single entity's file content.
 * Manages local editor state, dirty tracking, and atomic saves.
 */

import { useState, useEffect, useCallback } from 'react';
import { readFile, writeFile } from '../lib/fs/operations';
import { useAppStore } from '../store';
import type { ConfigEntity } from '../types';

interface UseEntityFileResult {
  /** Current editor content (may differ from saved state). */
  content: string;
  /** True if content differs from the last saved version. */
  isDirty: boolean;
  /** True while the file is being read on initial load. */
  isLoading: boolean;
  /** Error from the last read or write operation. */
  error: string | null;
  /** Updates the editor content (does not write to disk). */
  setContent: (value: string) => void;
  /** Writes the current content to disk atomically. */
  save: () => Promise<void>;
  /** Reverts content to the last saved version. */
  discard: () => void;
}

/**
 * Reads an entity's file on mount, tracks edits, and provides save/discard.
 * After a successful save, updates the entity's modifiedAt in the store.
 *
 * @param entity - The config entity whose file to manage. Null if no entity is selected.
 * @returns Editor state and action callbacks.
 */
export function useEntityFile(entity: ConfigEntity | null): UseEntityFileResult {
  const updateEntity = useAppStore((s) => s.updateEntity);

  const [savedContent, setSavedContent] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load file content when entity changes
  useEffect(() => {
    if (!entity) {
      setSavedContent('');
      setContent('');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    readFile(entity.fileHandle)
      .then((text) => {
        if (!cancelled) {
          setSavedContent(text);
          setContent(text);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to read file');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entity?.id]); // Re-load when the selected entity changes

  /**
   * Writes the current content to disk using the entity's file handle.
   * Updates the store's modifiedAt for the entity on success.
   */
  const save = useCallback(async () => {
    if (!entity) return;
    setError(null);
    try {
      await writeFile(entity.fileHandle, content);
      setSavedContent(content);
      // Refresh the lastModified timestamp in the store
      const file = await entity.fileHandle.getFile();
      updateEntity(entity.id, { modifiedAt: file.lastModified });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
      throw err; // Re-throw so callers can show a toast
    }
  }, [entity, content, updateEntity]);

  /**
   * Reverts the editor content to the last saved version.
   */
  const discard = useCallback(() => {
    setContent(savedContent);
    setError(null);
  }, [savedContent]);

  return {
    content,
    isDirty: content !== savedContent,
    isLoading,
    error,
    setContent,
    save,
    discard,
  };
}
