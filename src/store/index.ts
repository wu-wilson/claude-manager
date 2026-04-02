/**
 * Global Zustand store for UI state.
 * Holds the root directory handle, scanned entities, scan status, and theme.
 * All filesystem state is derived fresh from handles on each scan — this store is UI-only.
 */

import { create } from 'zustand';
import type { ConfigEntity } from '../types';

// --- State shape ---

interface AppState {
  /** The currently open root directory handle. Null if no directory is open. */
  rootHandle: FileSystemDirectoryHandle | null;
  /** All config entities discovered by the last scan. */
  entities: ConfigEntity[];
  /** True while a directory scan is in progress. */
  isScanning: boolean;
  /** Error message from the last failed scan or permission check. */
  scanError: string | null;
  /** The entity currently open in the editor panel. Null if none. */
  selectedEntity: ConfigEntity | null;
  /** Current color theme. */
  theme: 'light' | 'dark';
  /** Whether the sidebar is collapsed. */
  sidebarCollapsed: boolean;

  // --- Actions ---

  /** Sets the root directory handle after the user opens a directory. */
  setRootHandle: (handle: FileSystemDirectoryHandle) => void;
  /** Clears the root handle (user disconnected or changed directory). */
  clearRootHandle: () => void;
  /** Replaces the full entity list after a scan completes. */
  setEntities: (entities: ConfigEntity[]) => void;
  /** Marks the scan as in-progress or complete. */
  setScanning: (scanning: boolean) => void;
  /** Sets or clears the scan error message. */
  setScanError: (error: string | null) => void;
  /** Opens an entity in the editor panel. */
  selectEntity: (entity: ConfigEntity | null) => void;
  /** Updates a single entity in the list (e.g. after a save updates modifiedAt). */
  updateEntity: (id: string, patch: Partial<ConfigEntity>) => void;
  /** Removes an entity from the list by ID (after deletion). */
  removeEntity: (id: string) => void;
  /** Toggles between light and dark theme. */
  toggleTheme: () => void;
  /** Sets the theme directly. */
  setTheme: (theme: 'light' | 'dark') => void;
  /** Toggles the sidebar collapsed state. */
  toggleSidebar: () => void;
}

// --- Store creation ---

export const useAppStore = create<AppState>((set) => ({
  rootHandle: null,
  entities: [],
  isScanning: false,
  scanError: null,
  selectedEntity: null,
  theme: 'light',
  sidebarCollapsed: false,

  setRootHandle: (handle) => set({ rootHandle: handle, scanError: null }),

  clearRootHandle: () => set({ rootHandle: null, entities: [], selectedEntity: null }),

  setEntities: (entities) => set({ entities }),

  setScanning: (scanning) => set({ isScanning: scanning }),

  setScanError: (error) => set({ scanError: error }),

  selectEntity: (entity) => set({ selectedEntity: entity }),

  updateEntity: (id, patch) =>
    set((state) => ({
      entities: state.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      selectedEntity:
        state.selectedEntity?.id === id
          ? { ...state.selectedEntity, ...patch }
          : state.selectedEntity,
    })),

  removeEntity: (id) =>
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      selectedEntity: state.selectedEntity?.id === id ? null : state.selectedEntity,
    })),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  setTheme: (theme) => set({ theme }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
