/**
 * Top header bar showing the active directory name, rescan button,
 * theme toggle, and "Change Directory" button.
 */

import { RefreshCw, Sun, Moon, FolderOpen, PanelLeft } from 'lucide-react';
import { useAppStore } from '../../store';
import { useFileSystem } from '../../hooks/useFileSystem';
import { cn } from '../../lib/utils';

interface HeaderProps {
  /** Called when the user clicks "Change Directory" to return to onboarding. */
  onChangeDirectory: () => void;
}

/**
 * Application header with directory name, rescan, theme toggle, and nav controls.
 *
 * @param onChangeDirectory - Callback to trigger the directory picker.
 */
export function Header({ onChangeDirectory }: HeaderProps) {
  const { rootHandle, isScanning, theme, toggleTheme, toggleSidebar } = useAppStore();
  const { rescan } = useFileSystem();

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
      {/* Left: sidebar toggle + directory name */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleSidebar}
          className="focus-ring p-1.5 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[120px] sm:max-w-[200px]">
            {rootHandle?.name ?? 'No directory open'}
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Rescan */}
        <button
          onClick={() => rescan()}
          disabled={isScanning || !rootHandle}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
            'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100',
            'hover:bg-slate-100 dark:hover:bg-zinc-800',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus-ring transition-colors'
          )}
          aria-label="Rescan directory"
          title="Rescan directory (re-discover all config files)"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isScanning && 'animate-spin')} />
          <span className="hidden sm:inline">Rescan</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="focus-ring p-1.5 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Change directory */}
        <button
          onClick={onChangeDirectory}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
            'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100',
            'hover:bg-slate-100 dark:hover:bg-zinc-800',
            'focus-ring transition-colors'
          )}
          aria-label="Change open directory"
          title="Open a different directory"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change Directory</span>
        </button>
      </div>
    </header>
  );
}
