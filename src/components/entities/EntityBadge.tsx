/**
 * Small inline badge showing an entity type label with type-specific coloring.
 */

import { entityLabel, entityColorClass, entityBgClass, cn } from '../../lib/utils';
import type { EntityType } from '../../types';

interface EntityBadgeProps {
  type: EntityType;
  className?: string;
}

/**
 * Renders a color-coded badge for the given entity type.
 *
 * @param type - The entity type to display.
 * @param className - Optional additional class names.
 */
export function EntityBadge({ type, className }: EntityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
        entityColorClass(type),
        entityBgClass(type),
        className
      )}
    >
      {entityLabel(type)}
    </span>
  );
}

/** Scope badge — filled for project, outlined for user. */
export function ScopeBadge({
  scope,
  className,
}: {
  scope: 'project' | 'user';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
        scope === 'project'
          ? 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
          : 'border border-slate-300 dark:border-zinc-600 text-slate-600 dark:text-zinc-400',
        className
      )}
    >
      {scope}
    </span>
  );
}
