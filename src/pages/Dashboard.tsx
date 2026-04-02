/**
 * Dashboard / home page with summary cards, recently modified entities,
 * and quick-action buttons for creating new entities.
 */

import { useState, useMemo } from 'react';
import { Bot, Puzzle, Zap, Terminal, FileText, Settings, Brain, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { CreateEntityModal } from '../components/modals/CreateEntityModal';
import { EntityBadge } from '../components/entities/EntityBadge';
import { formatDate, cn } from '../lib/utils';
import type { EntityType } from '../types';

/** Summary card data. */
interface SummaryCard {
  label: string;
  type: EntityType;
  icon: React.ReactNode;
  route: string;
  colorClass: string;
  bgClass: string;
}

const SUMMARY_CARDS: SummaryCard[] = [
  { label: 'Agents', type: 'agent', icon: <Bot className="w-5 h-5" />, route: '/agents', colorClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-100 dark:bg-violet-900/30' },
  { label: 'Skills', type: 'skill', icon: <Puzzle className="w-5 h-5" />, route: '/skills', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { label: 'Hooks', type: 'hook', icon: <Zap className="w-5 h-5" />, route: '/hooks', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-900/30' },
  { label: 'Commands', type: 'command', icon: <Terminal className="w-5 h-5" />, route: '/commands', colorClass: 'text-sky-600 dark:text-sky-400', bgClass: 'bg-sky-100 dark:bg-sky-900/30' },
  { label: 'CLAUDE.md', type: 'claude_md', icon: <FileText className="w-5 h-5" />, route: '/claude-md', colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-100 dark:bg-rose-900/30' },
  { label: 'Memory', type: 'memory', icon: <Brain className="w-5 h-5" />, route: '/memory', colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { label: 'Settings', type: 'settings', icon: <Settings className="w-5 h-5" />, route: '/settings', colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-100 dark:bg-slate-800' },
];

type CreatableType = 'agent' | 'skill' | 'command' | 'claude_md';

/**
 * Main dashboard page showing entity counts and recent activity.
 */
export default function Dashboard() {
  const { entities } = useAppStore();
  const navigate = useNavigate();
  const [createType, setCreateType] = useState<CreatableType | null>(null);

  /** Count entities by type, excluding synthesized hook path entries. */
  function countByType(type: EntityType): number {
    return entities.filter((e) => e.type === type && !e.relativePath.includes('#')).length;
  }

  /** The 8 most recently modified non-hook, non-synthesized entities. */
  const recentEntities = useMemo(() => {
    return [...entities]
      .filter((e) => !e.relativePath.includes('#'))
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .slice(0, 8);
  }, [entities]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 sm:gap-8">
      {/* Summary cards */}
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
          Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
          {SUMMARY_CARDS.map((card) => {
            const count = countByType(card.type);
            return (
              <button
                key={card.type}
                onClick={() => navigate(card.route)}
                className={cn(
                  'flex flex-col gap-2 p-4 rounded-xl border bg-white dark:bg-zinc-900',
                  'border-slate-200 dark:border-zinc-800',
                  'hover:border-slate-300 dark:hover:border-zinc-700',
                  'focus-ring transition-colors text-left'
                )}
                aria-label={`View ${card.label} — ${count} total`}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bgClass)}>
                  <span className={card.colorClass}>{card.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {(['agent', 'skill', 'command', 'claude_md'] as CreatableType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCreateType(type)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium',
                'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800',
                'hover:border-indigo-300 dark:hover:border-indigo-700',
                'focus-ring transition-colors'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              New {type === 'claude_md' ? 'CLAUDE.md' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Recently modified */}
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
          Recently Modified
        </h2>
        {recentEntities.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-zinc-600">No entities yet. Open a directory to scan.</p>
        ) : (
          <ul role="list" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {recentEntities.map((entity) => (
              <li key={entity.id} role="listitem" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-slate-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                <EntityBadge type={entity.type} />
                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-zinc-200 truncate min-w-0">
                  {entity.name}
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-zinc-600 truncate max-w-[160px] hidden md:block">
                  {entity.relativePath}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-600 flex-shrink-0 hidden sm:flex">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {formatDate(entity.modifiedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create modal */}
      {createType && (
        <CreateEntityModal type={createType} onClose={() => setCreateType(null)} />
      )}
    </div>
  );
}
