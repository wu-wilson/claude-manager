/**
 * A list item card for a single configuration entity.
 * Shows name, path, badges, frontmatter preview tags, and last-modified time.
 */

import { Clock } from 'lucide-react';
import { EntityBadge, ScopeBadge } from './EntityBadge';
import { formatDate, truncatePath, cn } from '../../lib/utils';
import type { ConfigEntity } from '../../types';

interface EntityCardProps {
  entity: ConfigEntity;
  /** Whether this card is currently selected. */
  isSelected?: boolean;
  /** Whether this card is checked in multi-select mode. */
  isChecked?: boolean;
  /** Called when the card is clicked to open in the editor. */
  onClick: (entity: ConfigEntity) => void;
  /** Called when the checkbox state changes. */
  onCheckedChange?: (id: string, checked: boolean) => void;
}

/**
 * Renders a single entity card for use in entity list views.
 *
 * @param entity - The config entity to display.
 * @param isSelected - True if this entity is open in the editor.
 * @param isChecked - True if this entity is selected for bulk operations.
 * @param onClick - Callback when the card body is clicked.
 * @param onCheckedChange - Callback when the multi-select checkbox changes.
 */
export function EntityCard({
  entity,
  isSelected = false,
  isChecked = false,
  onClick,
  onCheckedChange,
}: EntityCardProps) {
  /** Extracts preview tags from frontmatter (tools array, model string, description). */
  function getPreviewTags(): string[] {
    const tags: string[] = [];
    const fm = entity.frontmatter;

    if (typeof fm.model === 'string') tags.push(fm.model);
    if (Array.isArray(fm.tools)) {
      tags.push(...(fm.tools as string[]).slice(0, 3));
      if ((fm.tools as string[]).length > 3) {
        tags.push(`+${(fm.tools as string[]).length - 3} more`);
      }
    }
    return tags;
  }

  const previewTags = getPreviewTags();
  const description =
    typeof entity.frontmatter.description === 'string' ? entity.frontmatter.description : null;

  return (
    <li
      role="listitem"
      className={cn(
        'group flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-800/60',
        'hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors',
        isSelected && 'bg-indigo-50/60 dark:bg-indigo-900/10 border-l-2 border-l-indigo-500'
      )}
    >
      {/* Checkbox for multi-select */}
      {onCheckedChange && (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onCheckedChange(entity.id, e.target.checked)}
          className="mt-1 focus-ring rounded"
          aria-label={`Select ${entity.name}`}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Card body */}
      <button
        onClick={() => onClick(entity)}
        className="flex-1 text-left min-w-0 focus-ring rounded"
        aria-label={`Open ${entity.name}`}
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-slate-900 dark:text-zinc-100 truncate">
                {entity.name}
              </span>
              <EntityBadge type={entity.type} />
              <ScopeBadge scope={entity.scope} />
            </div>

            {/* Path */}
            <p
              className="text-xs font-mono text-slate-400 dark:text-zinc-600 mt-0.5 truncate"
              title={entity.relativePath}
            >
              {truncatePath(entity.relativePath)}
            </p>

            {/* Description */}
            {description && (
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 line-clamp-1">
                {description}
              </p>
            )}

            {/* Frontmatter preview tags */}
            {previewTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {previewTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modified timestamp — hidden on very small screens */}
          <div
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-600 flex-shrink-0"
            title={new Date(entity.modifiedAt).toLocaleString()}
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>{formatDate(entity.modifiedAt)}</span>
          </div>
        </div>
      </button>
    </li>
  );
}
