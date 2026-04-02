/**
 * CodeMirror 6 editor wrapper with Markdown and JSON language support,
 * line numbers, and light/dark theme switching.
 */

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { useAppStore } from '../../store';

interface CodeEditorProps {
  /** Current editor content. */
  value: string;
  /** Called whenever the content changes. */
  onChange: (value: string) => void;
  /** Language mode. Defaults to 'markdown'. */
  language?: 'markdown' | 'json';
  /** Called when Ctrl/Cmd+S is pressed. */
  onSave?: () => void;
}

/**
 * A CodeMirror 6 editor component with Markdown or JSON highlighting.
 * Subscribes to the global theme so it switches between light/dark automatically.
 * Calls `onSave` when Ctrl/Cmd+S is pressed.
 *
 * @param value - The current document text.
 * @param onChange - Callback invoked on every edit.
 * @param language - Language mode for syntax highlighting.
 * @param onSave - Keyboard shortcut handler for saving.
 */
export function CodeEditor({ value, onChange, language = 'markdown', onSave }: CodeEditorProps) {
  const theme = useAppStore((s) => s.theme);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Keep callback refs current without re-creating the editor
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  /**
   * Builds the EditorState extensions array for the current configuration.
   *
   * @returns An array of CodeMirror extensions.
   */
  const buildExtensions = useCallback(() => {
    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.();
          return true;
        },
      },
    ]);

    return [
      history(),
      lineNumbers(),
      highlightActiveLine(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      saveKeymap,
      language === 'json' ? json() : markdown(),
      theme === 'dark' ? oneDark : [],
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { height: '100%', fontSize: '13px' },
        '.cm-scroller': { fontFamily: 'JetBrains Mono, monospace', overflow: 'auto' },
        '&.cm-focused': { outline: 'none' },
      }),
    ];
  }, [language, theme]);

  // Create editor on mount
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: buildExtensions(),
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconfigure extensions when language or theme changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.setState(
      EditorState.create({
        doc: view.state.doc.toString(),
        extensions: buildExtensions(),
      })
    );
  }, [language, theme, buildExtensions]);

  // Sync external value changes (e.g. discard/load) without resetting cursor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden bg-white dark:bg-[#0f0f0f]"
      aria-label="Code editor"
    />
  );
}
