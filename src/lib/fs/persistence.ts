/**
 * Persists and restores the root FileSystemDirectoryHandle across browser sessions
 * using idb-keyval (IndexedDB). localStorage cannot serialize these handles.
 */

import { get, set, del } from 'idb-keyval';

const HANDLE_KEY = 'rootDirectoryHandle';

// --- Storage helpers ---

/**
 * Persists a directory handle to IndexedDB so it can be restored
 * on the next session without requiring the user to re-open the picker.
 *
 * @param handle - The root directory handle to store.
 */
export async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await set(HANDLE_KEY, handle);
}

/**
 * Retrieves the previously stored directory handle from IndexedDB.
 * Returns null if no handle has been saved yet.
 *
 * @returns The stored handle, or null if none exists.
 */
export async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  return (await get<FileSystemDirectoryHandle>(HANDLE_KEY)) ?? null;
}

/**
 * Removes the stored directory handle from IndexedDB.
 * Called when the user explicitly changes or disconnects their directory.
 */
export async function clearHandle(): Promise<void> {
  await del(HANDLE_KEY);
}

// --- Permission helpers ---

/**
 * Checks whether the app still has read/write permission for a stored handle.
 * If permission has been revoked, prompts the user to re-grant it.
 * Must be called from a user gesture (e.g. a button click) since
 * requestPermission() requires one.
 *
 * @param handle - The directory handle to verify.
 * @returns True if permission is granted, false if denied or dismissed.
 */
export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission === 'granted') return true;
  const requested = await handle.requestPermission({ mode: 'readwrite' });
  return requested === 'granted';
}
