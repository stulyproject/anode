import { useSyncExternalStore, useMemo } from 'react';
import { useAnode, useViewport } from './context.js';
import { Entity } from '@stuly/anode';
import { Rect } from '@stuly/anode';

/**
 * Returns an array of all entities currently in the graph.
 * Reactively updates when nodes are created, deleted, or moved.
 *
 * @example
 * ```tsx
 * const nodes = useNodes();
 * ```
 */
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
          ctx.registerEntityMoveListener(update),
          ctx.registerBulkChangeListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

/**
 * Optimized hook for rendering a large-scale node graph.
 * Performs a spatial query on the QuadTree to return only the nodes
 * that are currently within the user's viewport (with padding).
 *
 * **Side Effects:** Triggers re-renders only when nodes enter or exit the viewport
 * OR when a visible node is moved.
 *
 * @param containerRect The dimensions of the canvas container. If omitted, defaults to window size.
 * @returns Array of visible Entity objects.
 */
export const useVisibleNodes = (containerRect?: { width: number; height: number }) => {
  const ctx = useAnode();
  const { viewport } = useViewport();

  const store = useMemo(() => {
    let lastVisibleIds: number[] = [];
    let lastSnapshot: Entity[] = [];

    const getQueryRect = () => {
      const w = (containerRect?.width || window.innerWidth) / viewport.k;
      const h = (containerRect?.height || window.innerHeight) / viewport.k;
      const x = -viewport.x / viewport.k;
      const y = -viewport.y / viewport.k;
      const padding = 300 / viewport.k;
      return new Rect(x - padding, y - padding, w + padding * 2, h + padding * 2);
    };

    const computeSnapshot = () => {
      const queryRect = getQueryRect();
      const visibleIds = Array.from(new Set(ctx.quadTree.query(queryRect)));

      // Compare sorted lists of IDs
      const sa = [...visibleIds].sort((a, b) => a - b);
      const sb = [...lastVisibleIds].sort((a, b) => a - b);

      let equal = sa.length === sb.length;
      if (equal) {
        for (let i = 0; i < sa.length; i++) {
          if (sa[i] !== sb[i]) {
            equal = false;
            break;
          }
        }
      }

      if (!equal) {
        lastVisibleIds = visibleIds;
        lastSnapshot = visibleIds.map((id) => ctx.entities.get(id)).filter((n): n is Entity => !!n);
      }
      return lastSnapshot;
    };

    computeSnapshot();

    return {
      subscribe: (onStoreChange: () => void) => {
        const update = () => {
          const oldSnapshot = lastSnapshot;
          const newSnapshot = computeSnapshot();
          if (newSnapshot !== oldSnapshot) {
            onStoreChange();
          }
        };

        const handles = [
          ctx.registerEntityCreateListener(update),
          ctx.registerEntityDropListener(update),
          ctx.registerEntityMoveListener(update),
          ctx.registerBulkChangeListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => computeSnapshot()
    };
  }, [ctx, viewport.x, viewport.y, viewport.k, containerRect?.width, containerRect?.height]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

/**
 * Returns an array of all links currently in the graph.
 * Reactively updates when links are created, deleted, or updated,
 * or when an endpoint entity moves (triggering path recalculation).
 */
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
          ctx.registerBulkChangeListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

/**
 * Returns an array of all sockets associated with a specific entity.
 * Reactively updates when sockets are added or removed from the entity.
 *
 * @param entityId The unique ID of the entity.
 */
export const useEntitySockets = (entityId: number) => {
  const ctx = useAnode();
  const store = useMemo(() => {
    let snapshot: any[] = [];
    const entity = ctx.entities.get(entityId);
    if (entity) snapshot = Array.from(entity.sockets.values());

    return {
      subscribe: (onStoreChange: () => void) => {
        const update = () => {
          const e = ctx.entities.get(entityId);
          snapshot = e ? Array.from(e.sockets.values()) : [];
          onStoreChange();
        };
        const h1 = ctx.registerSocketCreateListener((s) => {
          if (s.entityId === entityId) update();
        });
        const h2 = ctx.registerSocketDropListener((s) => {
          if (s.entityId === entityId) update();
        });
        const h3 = ctx.registerSocketMoveListener((s) => {
          if (s.entityId === entityId) update();
        });
        const h4 = ctx.registerBulkChangeListener(update);
        return () => {
          ctx.unregisterListener(h1);
          ctx.unregisterListener(h2);
          ctx.unregisterListener(h3);
          ctx.unregisterListener(h4);
        };
      },
      getSnapshot: () => snapshot
    };
  }, [ctx, entityId]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

/**
 * Subscribes to the reactive value of a specific socket.
 *
 * **Cause:** Triggers a re-render only when the value of the socket
 * changes due to engine propagation.
 *
 * @template T The type of the value held by the socket.
 * @param socketId The unique ID of the socket.
 * @returns The current socket value, or null if the socket doesn't exist.
 */
export function useSocketValue<T = any>(socketId: number | null): T {
  const ctx = useAnode();
  const store = useMemo(() => {
    return {
      subscribe: (onStoreChange: () => void) => {
        if (socketId === null) return () => {};
        const handle = ctx.registerSocketValueListener((s) => {
          if (s.id === socketId) {
            onStoreChange();
          }
        });
        const bulkHandle = ctx.registerBulkChangeListener(onStoreChange);
        return () => {
          ctx.unregisterListener(handle);
          ctx.unregisterListener(bulkHandle);
        };
      },
      getSnapshot: () => {
        if (socketId === null) return null;
        return ctx.sockets.get(socketId)?.value ?? null;
      }
    };
  }, [ctx, socketId]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * Returns an array of all groups currently in the graph.
 * Reactively updates when groups are created or deleted.
 */
export const useGroups = () => {
  const ctx = useAnode();
  const store = useMemo(() => {
    let snapshot = Array.from(ctx.groups.values());
    return {
      subscribe: (onStoreChange: () => void) => {
        snapshot = Array.from(ctx.groups.values());
        const update = () => {
          snapshot = Array.from(ctx.groups.values());
          onStoreChange();
        };
        const handles = [
          ctx.registerGroupCreateListener(update),
          ctx.registerGroupDropListener(update),
          ctx.registerEntityMoveListener(update), // Groups might need re-render on entity move if calculating dynamic bounds
          ctx.registerBulkChangeListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

/**
 * Returns the current bounding box of all entities in the graph (with padding).
 * Reactively updates when entities are added, removed, or moved.
 */
export const useGraphBounds = () => {
  const ctx = useAnode();
  const store = useMemo(() => {
    let lastBounds = { x: 0, y: 0, w: 1000, h: 1000 };

    const computeBounds = () => {
      if (ctx.entities.size === 0) {
        return { x: 0, y: 0, w: 1000, h: 1000 };
      }

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      for (const entity of ctx.entities.values()) {
        const pos = ctx.getWorldPosition(entity.id);
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      }

      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const w = maxX - minX;
      const h = maxY - minY;

      const diff =
        Math.abs(lastBounds.x - minX) > 0.01 ||
        Math.abs(lastBounds.y - minY) > 0.01 ||
        Math.abs(lastBounds.w - w) > 0.01 ||
        Math.abs(lastBounds.h - h) > 0.01;

      if (diff) {
        lastBounds = { x: minX, y: minY, w, h };
      }
      return lastBounds;
    };

    return {
      subscribe: (onStoreChange: () => void) => {
        const update = () => {
          const oldBounds = lastBounds;
          const newBounds = computeBounds();
          if (newBounds !== oldBounds) {
            onStoreChange();
          }
        };

        const handles = [
          ctx.registerEntityCreateListener(update),
          ctx.registerEntityDropListener(update),
          ctx.registerEntityMoveListener(update),
          ctx.registerBulkChangeListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => {
        return computeBounds();
      }
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
