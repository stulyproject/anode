import { useEffect } from 'react';
import { Context, Vec2, LinkKind, type LinkStyling } from '@stuly/anode';
import { useAnode } from '../../context.js';

/** Minimal representation of a Node for declarative synchronization. */
export interface NodeData {
  /** Unique ID for the node. Must be consistent across renders. */
  id: number;

  /** Absolute world position. */
  position: { x: number; y: number };

  /** Component type key (maps to `nodeTypes`). */
  type?: string;

  /** Custom data stored in the node's `inner` property. */
  data?: any;
}

/** Minimal representation of a Link for declarative synchronization. */
export interface LinkData {
  /** Unique ID for the link. Must be consistent across renders. */
  id: number;

  /** ID of the source entity. */
  source: number;

  /** Name of the source socket. */
  sourceHandle: string;

  /** ID of the target entity. */
  target: number;

  /** Name of the target socket. */
  targetHandle: string;

  /** Component type key (maps to `linkTypes`). */
  type?: string;

  /** Custom data stored in the link's `inner` property. */
  data?: any;

  /** Routing style for the link. */
  kind?: LinkKind;

  /** Aesthetic styling and animations. */
  styling?: LinkStyling;

  /** Optional custom intermediate points. */
  waypoints?: { x: number; y: number }[];
}

/** Configuration for the SyncManager hook. */
export interface SyncManagerProps {
  /** Current list of nodes from React state. */
  nodes?: NodeData[] | undefined;

  /** Current list of links from React state. */
  links?: LinkData[] | undefined;

  /** Callback to update external state when nodes are moved or dropped. */
  onNodesChange?: ((nodes: NodeData[], ctx: Context<any>) => void) | undefined;

  /** Callback to update external state when links are updated or dropped. */
  onLinksChange?: ((links: LinkData[], ctx: Context<any>) => void) | undefined;

  /** Default routing kind for new links created via UI. */
  defaultLinkKind?: LinkKind | undefined;
}

/**
 * Hook to synchronize external React state (nodes/links props) with the internal Anode engine.
 *
 * **Behaviors:**
 * 1. **Prop-to-Engine Sync:** When `nodes` or `links` props change, the hook performs a diff
 *    and applies atomic patches to the engine to match the prop state.
 * 2. **Engine-to-Prop Sync:** When the engine state changes (e.g., via user dragging or keyboard deletion),
 *    the corresponding `onNodesChange` or `onLinksChange` callbacks are triggered with the new state.
 * 3. **Batching:** Synchronization is wrapped in `ctx.batch()` to ensure atomicity and history integrity.
 *
 * **Side Effects:**
 * 1. Registers listeners for entity/link/socket lifecycle events in the Context.
 * 2. Automatically cleans up listeners on unmount.
 */
export const useSyncManager = ({
  nodes,
  links: linksProp,
  onNodesChange,
  onLinksChange,
  defaultLinkKind = LinkKind.BEZIER
}: SyncManagerProps) => {
  const ctx = useAnode();

  // Sync nodes prop to internal state
  useEffect(() => {
    if (!nodes) return;

    ctx.batch(() => {
      const currentIds = new Set(ctx.entities.keys());
      const incomingIds = new Set(nodes.map((n) => n.id));

      // Remove nodes not in props
      for (const id of currentIds) {
        if (!incomingIds.has(id)) {
          const entity = ctx.entities.get(id);
          if (entity) ctx.dropEntity(entity);
        }
      }

      // Add or update nodes from props
      for (const n of nodes) {
        const entity = ctx.entities.get(n.id);
        const innerData = { ...(n.data || {}), type: n.type };
        if (!entity) {
          const newEntity = ctx.newEntity(innerData, n.id);
          newEntity.move(n.position.x, n.position.y);
        } else {
          // Update position if it changed significantly (avoiding minor float jitters)
          if (
            Math.abs(entity.position.x - n.position.x) > 0.01 ||
            Math.abs(entity.position.y - n.position.y) > 0.01
          ) {
            entity.move(n.position.x, n.position.y);
          }
          // Update inner data
          entity.setInner(innerData);
        }
      }
    }, 'Sync Nodes from Props');
  }, [ctx, nodes]);

  // Sync links prop to internal state
  useEffect(() => {
    if (!linksProp) return;

    const syncLinks = () => {
      ctx.batch(() => {
        const currentIds = new Set(ctx.links.keys());
        const incomingIds = new Set(linksProp.map((l) => l.id));

        // Remove links not in props
        for (const id of currentIds) {
          if (!incomingIds.has(id)) {
            const link = ctx.links.get(id);
            if (link) ctx.dropLink(link);
          }
        }

        // Add links from props
        for (const l of linksProp) {
          const innerData = { ...(l.data || {}), type: l.type };
          const link = ctx.links.get(l.id);

          if (!link) {
            const fromNode = ctx.entities.get(l.source);
            const toNode = ctx.entities.get(l.target);
            if (fromNode && toNode) {
              const fromSocket = Array.from(fromNode.sockets.values()).find(
                (s) => s.name === l.sourceHandle
              );
              const toSocket = Array.from(toNode.sockets.values()).find(
                (s) => s.name === l.targetHandle
              );

              if (fromSocket && toSocket) {
                const newLink = ctx.newLink({
                  from: fromSocket,
                  to: toSocket,
                  kind: l.kind || defaultLinkKind,
                  id: l.id,
                  inner: innerData,
                  styling: l.styling
                });
                if (newLink && l.waypoints) {
                  newLink.waypoints = l.waypoints.map((p) => new Vec2(p.x, p.y));
                }
              }
            }
          } else {
            // Update existing link data
            link.inner = innerData;
            if (l.styling) {
              ctx.updateLinkStyling(link, l.styling);
            }
            if (l.waypoints) {
              link.waypoints = l.waypoints.map((p) => new Vec2(p.x, p.y));
            }
          }
        }
      }, 'Sync Links from Props');
    };

    syncLinks();
    // Also retry sync when sockets are created/dropped
    const h1 = ctx.registerSocketCreateListener(syncLinks);
    const h2 = ctx.registerSocketDropListener(syncLinks);
    return () => {
      ctx.unregisterListener(h1);
      ctx.unregisterListener(h2);
    };
  }, [ctx, linksProp, defaultLinkKind]);

  // Notify callbacks on internal changes
  useEffect(() => {
    if (!onNodesChange && !onLinksChange) return;

    const notify = () => {
      if (onNodesChange && nodes) {
        const currentNodes = Array.from(ctx.entities.values()).map((e) => ({
          id: e.id,
          position: { x: e.position.x, y: e.position.y },
          type: (e.inner as any)?.type,
          data: e.inner
        }));
        onNodesChange(currentNodes, ctx);
      }
      if (onLinksChange && linksProp) {
        const currentLinks = Array.from(ctx.links.values()).map((l) => {
          const fromSocket = ctx.sockets.get(l.from);
          const toSocket = ctx.sockets.get(l.to);
          return {
            id: l.id,
            source: fromSocket?.entityId || 0,
            sourceHandle: fromSocket?.name || '',
            target: toSocket?.entityId || 0,
            targetHandle: toSocket?.name || '',
            kind: l.kind,
            styling: l.styling,
            type: (l.inner as any)?.type,
            data: l.inner,
            waypoints: l.waypoints.map((p) => ({ x: p.x, y: p.y }))
          };
        });
        onLinksChange(currentLinks, ctx);
      }
    };

    const handles = [
      ctx.registerEntityCreateListener(notify),
      ctx.registerEntityDropListener(notify),
      ctx.registerEntityMoveListener(notify),
      ctx.registerLinkCreateListener(notify),
      ctx.registerLinkDropListener(notify),
      ctx.registerLinkUpdateListener(notify),
      ctx.registerBulkChangeListener(notify)
    ];

    return () => handles.forEach((h) => ctx.unregisterListener(h));
  }, [ctx, onNodesChange, onLinksChange, nodes, linksProp]);
};
