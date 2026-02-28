import React, { useEffect } from 'react';
import { useAnode, useSelection } from '../../context.js';

/**
 * Handles keyboard shortcuts for the Anode World.
 *
 * **Keybindings:**
 * - `Backspace` / `Delete`: Removes the currently selected nodes and links from the engine.
 * - `Ctrl+Z` (or `Cmd+Z`): Reverts the last operation in the engine's history.
 * - `Ctrl+Shift+Z` / `Ctrl+Y`: Re-applies the last undone operation.
 *
 * **Behaviors:**
 * 1. **Focus Protection:** Automatically ignores shortcut events when the user is typing in an `input` or `textarea`.
 * 2. **Transactional Deletion:** Selection removal is performed as a single atomic batch in history.
 */
export const ShortcutProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const ctx = useAnode();
  const { selection, setSelection } = useSelection();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        ctx.batch(() => {
          for (const nid of selection.nodes) {
            const entity = ctx.entities.get(nid);
            if (entity) ctx.dropEntity(entity);
          }
          for (const lid of selection.links) {
            const link = ctx.links.get(lid);
            if (link) ctx.dropLink(link);
          }
        }, 'Delete Selection');
        setSelection({ nodes: new Set(), links: new Set() });
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) ctx.redo();
        else ctx.undo();
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        ctx.redo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ctx, selection, setSelection]);

  return <>{children}</>;
};
