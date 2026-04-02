/**
 * A focus-trapped confirmation dialog for destructive or irreversible actions.
 * Renders in a portal, traps focus, and closes on Escape.
 */

import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' renders the confirm button in red. Defaults to 'default' (indigo). */
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation dialog with focus trapping and keyboard support.
 *
 * @param title - Dialog heading text.
 * @param description - Explanatory body text.
 * @param confirmLabel - Confirm button label. Defaults to "Confirm".
 * @param cancelLabel - Cancel button label. Defaults to "Cancel".
 * @param variant - Color variant for the confirm button.
 * @param onConfirm - Called when the user clicks confirm.
 * @param onCancel - Called when the user clicks cancel or presses Escape.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button on mount
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Trap focus within the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = dialog!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative z-10 bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 p-4 sm:p-6 max-w-sm w-full flex flex-col gap-4"
      >
        <div>
          <h2 id="confirm-dialog-title" className="font-semibold text-slate-900 dark:text-zinc-100">
            {title}
          </h2>
          <p id="confirm-dialog-desc" className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            {description}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
              'hover:bg-slate-200 dark:hover:bg-zinc-700',
              'focus-ring transition-colors'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'focus-ring transition-colors',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
