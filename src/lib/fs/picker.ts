/**
 * Wrapper around the File System Access API directory picker.
 * All calls to showDirectoryPicker must originate from a user gesture.
 */

/**
 * Prompts the user to select a local directory via the native OS picker.
 * Requests read/write access so the app can both read and save files.
 * Must be called from a user event handler (click, keydown) — not from useEffect.
 *
 * @returns A handle to the selected directory.
 * @throws If the user cancels the picker or permission is denied.
 */
export async function pickRootDirectory(): Promise<FileSystemDirectoryHandle> {
  return await window.showDirectoryPicker({ mode: 'readwrite' });
}
