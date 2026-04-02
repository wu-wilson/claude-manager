/**
 * Root application component.
 * Handles the onboarding/reconnect flow, app shell layout, and routing.
 */

import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DirectoryPicker } from './components/onboarding/DirectoryPicker';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store';
import { loadHandle } from './lib/fs/persistence';
import EditorPage from './pages/EditorPage';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/AgentsPage';
import SkillsPage from './pages/SkillsPage';
import CommandsPage from './pages/CommandsPage';
import HooksPage from './pages/HooksPage';
import ClaudeMdPage from './pages/ClaudeMdPage';
import SettingsPage from './pages/SettingsPage';
import MemoryPage from './pages/MemoryPage';

/**
 * Inner shell rendered once routing is available.
 * Handles the sidebar mobile-overlay behavior and the responsive editor split.
 *
 * @param onChangeDirectory - Callback to return to the directory picker.
 */
function AppShell({ onChangeDirectory }: { onChangeDirectory: () => void }) {
  const { selectedEntity, sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();

  // Track whether we're on a "narrow" viewport (below md = 768px)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close the mobile sidebar overlay when navigating to a new page
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      toggleSidebar();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // On mobile the sidebar is an overlay; on desktop it's inline and driven by the store
  const sidebarVisible = isMobile ? !sidebarCollapsed : !sidebarCollapsed;
  const showOverlay = isMobile && !sidebarCollapsed;

  // On mobile, open editor full-screen; on desktop use the 40/60 split
  const editorIsFullscreen = isMobile && selectedEntity !== null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onChangeDirectory={onChangeDirectory} />

      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile backdrop */}
        {showOverlay && (
          <div
            ref={overlayRef}
            className="fixed inset-0 z-20 bg-black/40"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — overlay on mobile, inline on desktop */}
        {sidebarVisible && (
          <div
            className={
              isMobile
                ? 'fixed inset-y-0 left-0 z-30 top-12'
                : 'relative z-0'
            }
          >
            <Sidebar />
          </div>
        )}

        <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          {/* Page content — hidden on mobile when editor is open */}
          <div
            className={
              editorIsFullscreen
                ? 'hidden'
                : selectedEntity
                ? 'w-2/5 flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col'
                : 'flex-1 flex flex-col overflow-hidden'
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/commands" element={<CommandsPage />} />
              <Route path="/hooks" element={<HooksPage />} />
              <Route path="/claude-md" element={<ClaudeMdPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/memory" element={<MemoryPage />} />
            </Routes>
          </div>

          {/* Editor panel */}
          {selectedEntity && (
            <div className="flex-1 flex flex-col min-w-0">
              <EditorPage />
            </div>
          )}
        </main>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only" id="toast-region" />
    </div>
  );
}

/**
 * Top-level app component. Renders either the onboarding screen or the full
 * app shell depending on whether a root directory is open.
 */
export function App() {
  useTheme();

  const { rootHandle, clearRootHandle } = useAppStore();
  const [showPicker, setShowPicker] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    loadHandle().then((handle) => {
      if (!handle && !rootHandle) setShowPicker(true);
      setInitialCheckDone(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isOnboarding = showPicker || (!rootHandle && initialCheckDone);

  if (!initialCheckDone) return null;

  if (isOnboarding) {
    return <DirectoryPicker onConnected={() => setShowPicker(false)} />;
  }

  return (
    <BrowserRouter>
      <AppShell
        onChangeDirectory={() => {
          clearRootHandle();
          setShowPicker(true);
        }}
      />
    </BrowserRouter>
  );
}
