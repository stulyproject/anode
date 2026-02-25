import React, { useSyncExternalStore, useMemo } from 'react';
import { useAnode, useViewport } from './context.js';
import { Entity, Link } from 'anode';
import { Rect } from 'anode';

export const useNodes = () => {
  const ctx = useAnode();
  const store = useMemo(() => {
    let snapshot = Array.from(ctx.entities.values());
    return {
      subscribe: (onStoreChange: () => void) => {
        snapshot = Array.from(ctx.entities.values());
        const update = () => {
          snapshot = Array.from(ctx.entities.values());
          onStoreChange();
        };
        const handles = [
          ctx.registerEntityCreateListener(update),
          ctx.registerEntityDropListener(update),
          ctx.registerEntityMoveListener(update) // Trigger on move
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

export const useVisibleNodes = (containerRect?: { width: number; height: number }) => {
  const ctx = useAnode();
  const { viewport } = useViewport();
  const allNodes = useNodes(); // Now triggers on move!

  return useMemo(() => {
    const w = (containerRect?.width || window.innerWidth) / viewport.k;
    const h = (containerRect?.height || window.innerHeight) / viewport.k;
    const x = -viewport.x / viewport.k;
    const y = -viewport.y / viewport.k;

    const padding = 300 / viewport.k;
    const queryRect = new Rect(x - padding, y - padding, w + padding * 2, h + padding * 2);

    const visibleIds = ctx.quadTree.query(queryRect);
    return visibleIds.map((id) => ctx.entities.get(id)).filter((n): n is Entity => !!n);
  }, [ctx, viewport, containerRect, allNodes]);
};

export const useEdges = () => {
  const ctx = useAnode();
  const store = useMemo(() => {
    let snapshot = Array.from(ctx.links.values());
    return {
      subscribe: (onStoreChange: () => void) => {
        snapshot = Array.from(ctx.links.values());

        const update = () => {
          snapshot = Array.from(ctx.links.values());
          onStoreChange();
        };
        const handles = [
          ctx.registerLinkCreateListener(update),
          ctx.registerLinkDropListener(update),
          ctx.registerEntityMoveListener(update) // Links need re-render on entity move
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
