/**
 * Core filesystem primitives for the File System Access API.
 * All file I/O in components must go through these functions — never call the raw API directly.
 */

// --- Read / Write ---

/**
 * Reads the full text content of a file.
 *
 * @param handle - A handle to the file to read.
 * @returns The file's text content as a string.
 */
export async function readFile(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

/**
 * Writes text content to a file atomically.
 * Uses createWritable() so the file is only updated on close(),
 * preventing partial writes if something fails mid-operation.
 *
 * @param handle - A handle to the file to write.
 * @param content - The full text content to write.
 */
export async function writeFile(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close(); // commits atomically
}

/**
 * Creates a new file in the given directory and writes initial content to it.
 * If a file with the same name already exists, it will be overwritten.
 *
 * @param dirHandle - The directory in which to create the file.
 * @param filename - The name of the file to create (e.g. "agent.md").
 * @param content - The initial text content to write.
 * @returns A handle to the newly created file.
 */
export async function createFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  content: string
): Promise<FileSystemFileHandle> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  await writeFile(fileHandle, content);
  return fileHandle;
}

// --- Directory helpers ---

/**
 * Creates a new subdirectory inside the given parent directory.
 * If the directory already exists, returns the existing handle.
 *
 * @param parent - The parent directory handle.
 * @param name - The name of the directory to create.
 * @returns A handle to the new (or existing) directory.
 */
export async function createDirectory(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return await parent.getDirectoryHandle(name, { create: true });
}

/**
 * Deletes a file or directory entry from the given parent directory.
 *
 * @param parent - The parent directory containing the entry to delete.
 * @param name - The name of the file or directory to remove.
 * @param recursive - If true, deletes directories and all their contents.
 *                    Defaults to false. Must be true when deleting skill directories.
 */
export async function deleteEntry(
  parent: FileSystemDirectoryHandle,
  name: string,
  recursive = false
): Promise<void> {
  await parent.removeEntry(name, { recursive });
}

// --- Walk / traverse ---

/**
 * Async generator that yields every file and directory entry
 * beneath the given directory handle, depth-first.
 * Skips no entries — callers should filter as needed.
 *
 * @param handle - The directory to walk.
 * @param path - The relative path prefix accumulated so far (used internally for recursion).
 * @yields An object with the entry's relative path, its handle, and its kind ('file' | 'directory').
 */
export async function* walkDirectory(
  handle: FileSystemDirectoryHandle,
  path = ''
): AsyncGenerator<{
  path: string;
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  kind: 'file' | 'directory';
}> {
  for await (const [name, entry] of handle.entries()) {
    const entryPath = path ? `${path}/${name}` : name;
    const typedEntry = entry.kind === 'file'
      ? (entry as FileSystemFileHandle)
      : (entry as FileSystemDirectoryHandle);
    yield { path: entryPath, handle: typedEntry, kind: entry.kind };
    if (entry.kind === 'directory') {
      yield* walkDirectory(entry as FileSystemDirectoryHandle, entryPath);
    }
  }
}

// --- Copy / Move ---

/**
 * Copies a file into a destination directory by reading its content
 * and writing it to a new file. The original file is not modified.
 *
 * @param sourceHandle - The file to copy.
 * @param destDir - The destination directory.
 * @param destName - The filename to use in the destination directory.
 */
export async function copyFile(
  sourceHandle: FileSystemFileHandle,
  destDir: FileSystemDirectoryHandle,
  destName: string
): Promise<void> {
  const content = await readFile(sourceHandle);
  await createFile(destDir, destName, content);
}

/**
 * Moves a file to a new location by copying it to the destination
 * and then deleting it from the source directory.
 *
 * @param sourceHandle - The file to move.
 * @param sourceDirHandle - The directory currently containing the file.
 * @param sourceFilename - The current filename (used to delete it after copying).
 * @param destDir - The destination directory.
 * @param destName - The filename to use in the destination directory.
 */
export async function moveFile(
  sourceHandle: FileSystemFileHandle,
  sourceDirHandle: FileSystemDirectoryHandle,
  sourceFilename: string,
  destDir: FileSystemDirectoryHandle,
  destName: string
): Promise<void> {
  await copyFile(sourceHandle, destDir, destName);
  await deleteEntry(sourceDirHandle, sourceFilename);
}

/**
 * Recursively copies an entire directory (including all nested files)
 * into a destination parent, preserving the directory name.
 * Used for skill directories which are folders, not single files.
 *
 * @param sourceDir - The directory to copy.
 * @param destParent - The parent directory to copy into.
 * @param destName - The name for the copied directory in the destination.
 */
export async function copyDirectory(
  sourceDir: FileSystemDirectoryHandle,
  destParent: FileSystemDirectoryHandle,
  destName: string
): Promise<void> {
  const destDir = await createDirectory(destParent, destName);
  for await (const entry of walkDirectory(sourceDir)) {
    if (entry.kind === 'file') {
      const fileHandle = entry.handle as FileSystemFileHandle;
      const content = await readFile(fileHandle);
      // Reconstruct directory structure at destination
      const parts = entry.path.split('/');
      let currentDir = destDir;
      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = await createDirectory(currentDir, parts[i]);
      }
      await createFile(currentDir, parts[parts.length - 1], content);
    }
  }
}
