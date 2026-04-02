/**
 * Hook for all root directory operations: opening a directory, restoring a
 * persisted handle, verifying permission, and triggering entity scans.
 */

import { useCallback } from 'react';
import { pickRootDirectory } from '../lib/fs/picker';
import { saveHandle, loadHandle, clearHandle, verifyPermission } from '../lib/fs/persistence';
import { scanConfigEntities } from '../lib/fs/scanner';
import { useAppStore } from '../store';

/**
 * Provides filesystem operations and scan state to components.
 * Wraps the store's raw state with async actions that handle permission
 * verification, scanning, and error reporting.
 *
 * @returns An object with `openDirectory`, `restoreDirectory`, `rescan`, and `disconnect`.
 */
export function useFileSystem() {
  const {
    rootHandle,
    entities,
    isScanning,
    scanError,
    setRootHandle,
    clearRootHandle,
    setEntities,
    setScanning,
    setScanError,
  } = useAppStore();

  /**
   * Runs the entity scanner against the current root handle and updates the store.
   * Silently no-ops if no root handle is set.
   *
   * @param handle - The root directory handle to scan. Defaults to the current store handle.
   */
  const rescan = useCallback(
    async (handle?: FileSystemDirectoryHandle) => {
      const target = handle ?? rootHandle;
      if (!target) return;
      setScanning(true);
      setScanError(null);
      try {
        const found = await scanConfigEntities(target);
        setEntities(found);
      } catch (err) {
        setScanError(err instanceof Error ? err.message : 'Scan failed');
      } finally {
        setScanning(false);
      }
    },
    [rootHandle, setScanning, setScanError, setEntities]
  );

  /**
   * Prompts the user to select a directory via the OS picker.
   * On success, saves the handle to IndexedDB and triggers a scan.
   * Must be called from a user event handler.
   */
  const openDirectory = useCallback(async () => {
    setScanError(null);
    try {
      const handle = await pickRootDirectory();
      await saveHandle(handle);
      setRootHandle(handle);
      await rescan(handle);
    } catch (err) {
      // User cancelled the picker — not an error worth surfacing
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Chrome blocks sensitive directories (Desktop, Documents, home root, etc.)
      if (err instanceof DOMException && err.name === 'SecurityError') {
        setScanError(
          'Chrome blocked that folder because it contains system files. ' +
          'Instead, navigate directly into your ~/.claude folder, or open a project folder that contains a .claude/ subdirectory.'
        );
        return;
      }
      setScanError(err instanceof Error ? err.message : 'Failed to open directory');
    }
  }, [setScanError, setRootHandle, rescan]);

  /**
   * Attempts to restore a previously opened directory from IndexedDB.
   * Returns true if a handle was found and permission was confirmed.
   * Returns false if no handle exists or permission was denied.
   * Must be called from a user event handler (permission check requires a gesture).
   *
   * @returns True if the directory was successfully restored, false otherwise.
   */
  const restoreDirectory = useCallback(async (): Promise<boolean> => {
    const handle = await loadHandle();
    if (!handle) return false;
    const permitted = await verifyPermission(handle);
    if (!permitted) return false;
    setRootHandle(handle);
    await rescan(handle);
    return true;
  }, [setRootHandle, rescan]);

  /**
   * Clears the stored handle from IndexedDB and resets all filesystem state.
   */
  const disconnect = useCallback(async () => {
    await clearHandle();
    clearRootHandle();
  }, [clearRootHandle]);

  return {
    rootHandle,
    entities,
    isScanning,
    scanError,
    openDirectory,
    restoreDirectory,
    rescan,
    disconnect,
  };
}
