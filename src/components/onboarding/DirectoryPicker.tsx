/**
 * Full-screen welcome/onboarding screen shown when no directory is open.
 * Handles the initial "Open Directory" flow and the reconnect flow for
 * returning users whose handle permission needs to be re-granted.
 */

import { useState, useEffect } from 'react';
import { FolderOpen, Home, FolderCode, AlertTriangle, RefreshCw } from 'lucide-react';
import { loadHandle } from '../../lib/fs/persistence';
import { useFileSystem } from '../../hooks/useFileSystem';
import { cn } from '../../lib/utils';

/**
 * Shown when the File System Access API is not available in the current browser.
 */
function UnsupportedBrowser() {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-md">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <h1 className="text-2xl font-semibold">Browser Not Supported</h1>
      <p className="text-slate-500 dark:text-zinc-400">
        Claude Code Config Manager requires the{' '}
        <strong>File System Access API</strong>, which is supported in Chrome 86+
        and Edge 86+. Firefox and Safari have limited support.
      </p>
      <p className="text-slate-500 dark:text-zinc-400">
        Please open this app in Google Chrome or Microsoft Edge.
      </p>
    </div>
  );
}

/**
 * The main onboarding/reconnect screen. Detects whether a stored handle exists
 * and offers either a reconnect flow or fresh open flow accordingly.
 *
 * @param onConnected - Called after the directory is successfully opened and scanned.
 */
export function DirectoryPicker({ onConnected }: { onConnected: () => void }) {
  const { openDirectory, restoreDirectory, scanError } = useFileSystem();
  const [hasStoredHandle, setHasStoredHandle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const isSupported = 'showDirectoryPicker' in window;

  // Check whether a handle is stored without requesting permission
  useEffect(() => {
    loadHandle().then((handle) => {
      setHasStoredHandle(handle !== null);
      setChecked(true);
    });
  }, []);

  /**
   * Handles the "Open Directory" button click.
   * Calls openDirectory() which triggers the OS picker.
   */
  async function handleOpen() {
    setIsLoading(true);
    try {
      await openDirectory();
      onConnected();
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handles the "Reconnect" button click for returning users.
   * Calls restoreDirectory() which verifies/re-grants permission.
   */
  async function handleReconnect() {
    setIsLoading(true);
    try {
      const ok = await restoreDirectory();
      if (ok) onConnected();
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0f0f0f] p-8">
        <UnsupportedBrowser />
      </div>
    );
  }

  if (!checked) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0f0f0f] p-4 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:gap-8 max-w-lg w-full">
        {/* Logo / title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center">
            <FolderCode className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Claude Config Manager
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
            A local-first dashboard for inspecting, editing, and organizing your Claude
            Code configuration files — agents, skills, hooks, commands, and more.
            No server. No uploads. Everything stays on your machine.
          </p>
        </div>

        {/* Error display */}
        {scanError && (
          <div
            role="alert"
            className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400"
          >
            {scanError}
          </div>
        )}

        {/* Reconnect section (returning users) */}
        {hasStoredHandle && (
          <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <p className="text-sm font-medium">Resume previous session</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              Your browser needs you to confirm access to the previously opened directory.
            </p>
            <button
              onClick={handleReconnect}
              disabled={isLoading}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 rounded-lg',
                'bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'focus-ring transition-colors'
              )}
              aria-label="Reconnect to previously opened directory"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              {isLoading ? 'Reconnecting…' : 'Reconnect'}
            </button>
          </div>
        )}

        {/* Open directory buttons */}
        <div className="w-full flex flex-col gap-3">
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wider text-center">
            {hasStoredHandle ? 'Or open a different directory' : 'Choose a directory to open'}
          </p>
          <button
            onClick={handleOpen}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-3 w-full p-4 rounded-xl text-left',
              'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800',
              'hover:border-indigo-400 dark:hover:border-indigo-600',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'focus-ring transition-colors group'
            )}
            aria-label="Open .claude folder for user-level Claude configuration"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
              <Home className="w-4 h-4 text-slate-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-sm">User-level config</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                Navigate into <code className="font-mono">~/.claude</code> and select it
              </p>
            </div>
          </button>

          <button
            onClick={handleOpen}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-3 w-full p-4 rounded-xl text-left',
              'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800',
              'hover:border-indigo-400 dark:hover:border-indigo-600',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'focus-ring transition-colors group'
            )}
            aria-label="Open project directory for project-level Claude configuration"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
              <FolderOpen className="w-4 h-4 text-slate-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Project-level config</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                Select a project folder that contains a <code className="font-mono">.claude/</code> subdirectory
              </p>
            </div>
          </button>
        </div>

        {/* Chrome restriction callout */}
        <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Chrome restriction:</strong> Chrome blocks opening Desktop, Documents, Downloads, and your home folder directly. Always navigate <em>into</em> the target folder before selecting it.
          </p>
        </div>

        <p className="text-xs text-slate-400 dark:text-zinc-600 text-center">
          Requires Chrome 86+ or Edge 86+
        </p>
      </div>
    </div>
  );
}
