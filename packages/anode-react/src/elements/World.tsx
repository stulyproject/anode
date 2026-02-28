import React, { useState, useEffect, useContext } from 'react';
import { AnodeReactContext } from '../context.js';
import { useVisibleNodes, useEdges, useGroups } from '../hooks.js';
import { Node, type NodeComponentProps } from './Node.js';
import { Group } from './Group.js';
import { Link, type LinkComponentProps } from './Link.js';
import { LinkKind, Context } from '@stuly/anode';
import { useSyncManager, type NodeData, type LinkData } from './World/SyncManager.js';
export type { NodeData, LinkData };
import { ShortcutProvider } from './World/ShortcutProvider.js';
import { useViewportManager } from './World/ViewportManager.js';
import { useInteractionHandler } from './World/useInteractionHandler.js';

const DefaultNode: React.FC<NodeComponentProps> = ({ entity }) => (
  <div style={{ padding: 10, background: 'white', border: '1px solid #ccc', borderRadius: 4 }}>
    {entity.inner?.label || `Node ${entity.id}`}
  </div>
);

export interface WorldProps {
  /** Elements to overlay on the world (e.g., Background, MiniMap, Controls). */
  children?: React.ReactNode;

  /** Styles applied to the outer container. */
  style?: React.CSSProperties;

  /** Styles applied to the selection marquee box. */
  selectionBoxStyle?: React.CSSProperties;

  /** Map of custom node components indexed by their `type` key. */
  nodeTypes?: Record<string, React.ComponentType<NodeComponentProps>> | undefined;

  /** Map of custom link components indexed by their `type` key. */
  linkTypes?: Record<string, React.ComponentType<LinkComponentProps>> | undefined;

  /** Default routing style for newly created links. Defaults to BEZIER. */
  defaultLinkKind?: LinkKind | undefined;

  /** Callback triggered when a connection is completed via drag-and-drop. */
  onConnect?: ((fromId: number, toId: number, ctx: Context<any>) => void) | undefined;

  /** Custom validation logic for connections. Return false to block a link. */
  isValidConnection?: ((from: any, to: any, ctx: Context<any>) => boolean) | undefined;

  /** Declarative list of nodes for state-controlled synchronization. */
  nodes?: NodeData[] | undefined;

  /** Declarative list of links for state-controlled synchronization. */
  links?: LinkData[] | undefined;

  /** Callback triggered when internal engine changes require a node state update. */
  onNodesChange?: ((nodes: NodeData[], ctx: Context<any>) => void) | undefined;

  /** Callback triggered when internal engine changes require a link state update. */
  onLinksChange?: ((links: LinkData[], ctx: Context<any>) => void) | undefined;
}

/**
 * The primary canvas component for Anode.
 *
 * **Behaviors:**
 * 1. **Interaction:** Handles zoom (wheel), pan (drag), and selection (click/marquee).
 * 2. **Declarative Sync:** Automatically mirrors the `nodes` and `links` props into the internal engine state.
 * 3. **Spatial Culling:** Only renders nodes that are currently within the visible viewport (plus padding).
 * 4. **Keyboard Shortcuts:** Supports Delete (remove selection) and Undo/Redo (Ctrl+Z/Y).
 *
 * **Side Effects:**
 * 1. Manages a global `ResizeObserver` to update the viewport on container resize.
 * 2. Synchronizes the `screenToWorld` coordinate conversion function in the context.
 *
 * @usage
 * ```tsx
 * <World
 *   nodes={myNodes}
 *   links={myLinks}
 *   onNodesChange={handleNodesChange}
 *   nodeTypes={{ custom: MyCustomNode }}
 * />
 * ```
 */
export const World: React.FC<WorldProps> = ({
  children,
  style,
  nodeTypes = {},
  linkTypes = {},
  defaultLinkKind = LinkKind.BEZIER,
  onConnect,
  isValidConnection,
  selectionBoxStyle,
  nodes,
  links: linksProp,
  onNodesChange,
  onLinksChange
}) => {
  const ctxValue = useContext(AnodeReactContext)!;
  const { setScreenToWorld, worldRef } = ctxValue;

  if (!worldRef) {
    throw new Error('World must be used within AnodeProvider with a valid worldRef');
  }

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Viewport Management (Pan/Zoom)
  const { transform } = useViewportManager(worldRef);

  // Interaction Handling (Selection/Dragging/Links)
  const { onMouseDown, onTouchStart, selectionBox, pendingLink } = useInteractionHandler({
    worldRef,
    onConnect,
    isValidConnection,
    defaultLinkKind
  });

  // Declarative Sync (Props to Engine)
  useSyncManager({
    nodes,
    links: linksProp,
    onNodesChange,
    onLinksChange,
    defaultLinkKind
  });

  // Keep screenToWorld function updated with current viewport transform
  useEffect(() => {
    setScreenToWorld(() => (clientX: number, clientY: number) => {
      if (!worldRef.current) return { x: clientX, y: clientY };
      const rect = worldRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - transform.x) / transform.k,
        y: (clientY - rect.top - transform.y) / transform.k
      };
    });
  }, [setScreenToWorld, transform]);

  // Observer container size for culling logic
  useEffect(() => {
    if (!worldRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(worldRef.current);
    return () => observer.disconnect();
  }, []);

  const entities = useVisibleNodes(containerSize);
  const links = useEdges();
  const groups = useGroups();

  return (
    <ShortcutProvider>
      <div
        ref={worldRef}
        className="__anode-world"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          userSelect: 'none',
          background: '#f1f5f9',
          ...style
        }}
      >
        {children}

        {selectionBox && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
              border: '1px solid #3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000,
              ...selectionBoxStyle
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            transformOrigin: '0 0',
            pointerEvents: 'none'
          }}
        >
          {/* Link Layer */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100000px',
              height: '100000px',
              pointerEvents: 'none',
              zIndex: 0,
              overflow: 'visible'
            }}
          >
            <g style={{ pointerEvents: 'auto' }}>
              {links.map((link) => {
                const type = link.inner?.type || 'default';
                const Component = linkTypes[type];
                return <Link key={link.id} id={link.id} component={Component} />;
              })}
            </g>
            {/* Connection Preview */}
            {pendingLink && (
              <line
                x1={pendingLink.fromPos.x}
                y1={pendingLink.fromPos.y}
                x2={pendingLink.toPos.x}
                y2={pendingLink.toPos.y}
                stroke={pendingLink.isValid ? '#94a3b8' : '#ef4444'}
                strokeWidth={2 / transform.k}
                strokeDasharray={4 / transform.k}
              />
            )}
          </svg>

          {/* Node/Group Layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            {groups.map((group) => (
              <Group key={group.id} id={group.id} />
            ))}
            {entities.map((entity) => {
              const type = entity.inner?.type || 'default';
              const Component = nodeTypes[type] || DefaultNode;
              return (
                <Node key={entity.id} id={entity.id}>
                  <div style={{ pointerEvents: 'auto' }}>
                    <Component entity={entity} />
                  </div>
                </Node>
              );
            })}
          </div>
        </div>
      </div>
    </ShortcutProvider>
  );
};
