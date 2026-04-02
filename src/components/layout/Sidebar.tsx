/**
 * Fixed left sidebar with collapsible navigation groups for each entity type.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Puzzle,
  Zap,
  Terminal,
  FileText,
  Settings,
  Brain,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { cn } from '../../lib/utils';
import type { EntityType } from '../../types';

/** A single sidebar navigation item definition. */
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  entityType?: EntityType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Agents', path: '/agents', icon: <Bot className="w-4 h-4" />, entityType: 'agent' },
  { label: 'Skills', path: '/skills', icon: <Puzzle className="w-4 h-4" />, entityType: 'skill' },
  { label: 'Hooks', path: '/hooks', icon: <Zap className="w-4 h-4" />, entityType: 'hook' },
  { label: 'Commands', path: '/commands', icon: <Terminal className="w-4 h-4" />, entityType: 'command' },
  { label: 'CLAUDE.md', path: '/claude-md', icon: <FileText className="w-4 h-4" />, entityType: 'claude_md' },
  { label: 'Memory', path: '/memory', icon: <Brain className="w-4 h-4" />, entityType: 'memory' },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" />, entityType: 'settings' },
];

/** Color classes per entity type for count badges. */
const COUNT_BADGE_CLASSES: Partial<Record<EntityType, string>> = {
  agent: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  skill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  hook: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  command: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  claude_md: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  settings: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  memory: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
};

/**
 * Application sidebar with entity type navigation and entity counts.
 * On mobile it renders as a full-height overlay panel with a close button.
 */
export function Sidebar() {
  const { entities, sidebarCollapsed, toggleSidebar } = useAppStore();

  /** Count entities of a given type, excluding synthesized hook sub-entries. */
  function countByType(type: EntityType): number {
    return entities.filter((e) => e.type === type && !e.relativePath.includes('#hook')).length;
  }

  if (sidebarCollapsed) return null;

  return (
    <aside
      className="w-60 h-full flex-shrink-0 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col overflow-y-auto"
      aria-label="Main navigation"
    >
      {/* Header row: label + mobile close button */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Navigation
        </p>
        <button
          onClick={toggleSidebar}
          className="md:hidden focus-ring p-1 rounded text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav links */}
      <nav>
        <ul role="list" className="px-2 pb-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const count = item.entityType ? countByType(item.entityType) : null;
            const badgeClass = item.entityType ? COUNT_BADGE_CLASSES[item.entityType] : null;

            return (
              <li key={item.path} role="listitem">
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      'focus-ring',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
                    )
                  }
                  aria-label={item.label}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {count !== null && count > 0 && (
                    <span
                      className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded-full tabular-nums',
                        badgeClass
                      )}
                      aria-label={`${count} ${item.label}`}
                    >
                      {count}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
