/**
 * Breadcrumb component showing the relative path of the currently selected entity.
 * Displays an asterisk indicator when the file has unsaved changes.
 */

import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbProps {
  /** Relative path to split into breadcrumb segments (e.g. ".claude/agents/foo.md"). */
  relativePath: string;
  /** If true, shows an unsaved changes indicator. */
  isDirty?: boolean;
}

/**
 * Renders a relative path as clickable breadcrumb segments.
 * Adds an asterisk suffix on the last segment when `isDirty` is true.
 *
 * @param relativePath - The entity's relative path from the root.
 * @param isDirty - Whether the entity has unsaved changes.
 */
export function Breadcrumb({ relativePath, isDirty = false }: BreadcrumbProps) {
  const parts = relativePath.split('/');

  return (
    <nav aria-label="File location" className="flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-zinc-500 min-w-0 overflow-hidden">
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        return (
          <span key={index} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            )}
            <span
              className={cn(
                'truncate',
                isLast ? 'text-slate-800 dark:text-zinc-200 font-medium' : ''
              )}
            >
              {part}
              {isLast && isDirty && (
                <span
                  className="ml-0.5 text-indigo-500"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                >
                  *
                </span>
              )}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
