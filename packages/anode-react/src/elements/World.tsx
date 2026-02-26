import React, { useState, useRef, useEffect, useContext } from 'react';
import { useAnode, useViewport, useSelection, AnodeReactContext } from '../context.js';
import { useVisibleNodes, useEdges, useGroups } from '../hooks.js';
import { Node } from './Node.js';
import type { NodeComponentProps } from './Node.js';
import { Group } from './Group.js';
import { Link, type LinkComponentProps } from './Link.js';
import { Vec2, LinkKind, Rect, Context } from '@stuly/anode';

export interface NodeData {
  id: number;
  position: { x: number; y: number };
  type?: string;
  data?: any;
}

export interface LinkData {
  id: number;
  source: number;
  sourceHandle: string;
  target: number;
  targetHandle: string;
  type?: string;
  data?: any;
  kind?: LinkKind;
  waypoints?: { x: number; y: number }[];
}

const DefaultNode: React.FC<NodeComponentProps> = ({ entity }) => (
  <div style={{ padding: 10, background: 'white', border: '1px solid #ccc', borderRadius: 4 }}>
    {entity.inner?.label || `Node ${entity.id}`}
  </div>
);

const getDistance = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
  return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
};

const getCenter = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  };
};

export const World: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  selectionBoxStyle?: React.CSSProperties;
  nodeTypes?: Record<string, React.ComponentType<NodeComponentProps>>;
  linkTypes?: Record<string, React.ComponentType<LinkComponentProps>>;
  defaultLinkKind?: LinkKind;
  onConnect?: (fromId: number, toId: number, ctx: Context<any>) => void;
  isValidConnection?: (from: any, to: any, ctx: Context<any>) => boolean;
  nodes?: NodeData[];
  links?: LinkData[];
  onNodesChange?: (nodes: NodeData[], ctx: Context<any>) => void;
  onLinksChange?: (links: LinkData[], ctx: Context<any>) => void;
}> = ({
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
  const ctx = useAnode();
  const { viewport: transform, setViewport: setTransform, screenToWorld } = useViewport();
  const { setScreenToWorld } = useContext(AnodeReactContext)!;
  const { selection, setSelection } = useSelection();
  const worldRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  useEffect(() => {
    setScreenToWorld(() => (clientX: number, clientY: number) => {
      if (!worldRef.current) return { x: clientX, y: clientY };
      const rect = worldRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - transformRef.current.x) / transformRef.current.k,
        y: (clientY - rect.top - transformRef.current.y) / transformRef.current.k
      };
    });
  }, [setScreenToWorld]);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Declarative Sync Logic //

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
                const newLink = ctx.newLink(
                  fromSocket,
                  toSocket,
                  l.kind || defaultLinkKind,
                  l.id,
                  innerData
                );
                if (newLink && l.waypoints) {
                  newLink.waypoints = l.waypoints.map((p) => new Vec2(p.x, p.y));
                }
              }
            }
          } else {
            // Update existing link data
            link.inner = innerData;
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

  // SYNC END

  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Track container size for accurate spatial culling
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

  // Native wheel listener to allow preventDefault (fixing passive listener error)
  useEffect(() => {
    const el = worldRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const t = transformRef.current;

      const delta = -e.deltaY;
      const factor = Math.pow(1.1, delta / 100);
      const newK = Math.min(Math.max(t.k * factor, 0.1), 5);

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const beforeKMouseX = (mouseX - t.x) / t.k;
      const beforeKMouseY = (mouseY - t.y) / t.k;

      const newX = mouseX - beforeKMouseX * newK;
      const newY = mouseY - beforeKMouseY * newK;

      setTransform({ x: newX, y: newY, k: newK });
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [setTransform]);

  const entities = useVisibleNodes(containerSize);
  const links = useEdges();
  const groups = useGroups();
  const [pendingLink, setPendingLink] = useState<{
    fromId: number;
    fromPos: Vec2;
    toPos: Vec2;
    isValid: boolean;
  } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Deletion
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Only delete if not typing in an input
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

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

      // Undo / Redo
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

  useEffect(() => {
    const handleLinkStart = (e: any) => {
      const { socketId, x, y } = e.detail;
      const rect = worldRef.current?.getBoundingClientRect();
      if (!rect) return;

      const fromSocket = ctx.sockets.get(socketId);
      if (!fromSocket) return;

      const fromWorldPos = ctx.getWorldPosition(fromSocket.entityId);

      const fromPos = new Vec2(
        fromWorldPos.x + fromSocket.offset.x,
        fromWorldPos.y + fromSocket.offset.y
      );

      setPendingLink({
        fromId: socketId,
        fromPos,
        toPos: new Vec2(
          (x - rect.left - transform.x) / transform.k,
          (y - rect.top - transform.y) / transform.k
        ),
        isValid: true
      });

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const touches = (moveEvent as TouchEvent).touches;
        const clientX = touches ? (touches[0]?.clientX ?? 0) : (moveEvent as MouseEvent).clientX;
        const clientY = touches ? (touches[0]?.clientY ?? 0) : (moveEvent as MouseEvent).clientY;
        const target = touches
          ? document.elementFromPoint(clientX, clientY)
          : (moveEvent.target as HTMLElement);
        const targetSocketEl = target?.closest('.anode-socket') as HTMLElement;
        let isValid = true;

        if (targetSocketEl) {
          const toId = parseInt(targetSocketEl.getAttribute('data-socket-id') || '');
          const from = ctx.sockets.get(socketId);
          const to = ctx.sockets.get(toId);
          if (from && to) {
            isValid =
              ctx.canLink(from, to) && (!isValidConnection || isValidConnection(from, to, ctx));
          }
        }

        setPendingLink((prev) =>
          prev
            ? {
                ...prev,
                toPos: new Vec2(
                  (clientX - rect.left - transform.x) / transform.k,
                  (clientY - rect.top - transform.y) / transform.k
                ),
                isValid
              }
            : null
        );
      };

      const onUp = (upEvent: MouseEvent | TouchEvent) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);

        let target: HTMLElement | null = null;
        const changedTouches = (upEvent as TouchEvent).changedTouches;
        if (changedTouches) {
          const touch = changedTouches[0];
          target = touch
            ? (document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement)
            : null;
        } else {
          target = upEvent.target as HTMLElement;
        }

        const targetSocket = target?.closest('.anode-socket') as HTMLElement;
        if (targetSocket) {
          const toId = parseInt(targetSocket.getAttribute('data-socket-id') || '');
          const from = ctx.sockets.get(socketId);
          const to = ctx.sockets.get(toId);

          if (from && to) {
            const valid =
              ctx.canLink(from, to) && (!isValidConnection || isValidConnection(from, to, ctx));
            if (valid) {
              if (onConnect) {
                onConnect(socketId, toId, ctx);
              } else {
                ctx.newLink(from, to, defaultLinkKind);
              }
            }
          }
        }
        setPendingLink(null);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    };

    const handleReconnect = (e: any) => {
      const { linkId, type, x, y } = e.detail;
      const rect = worldRef.current?.getBoundingClientRect();
      if (!rect) return;

      const link = ctx.links.get(linkId);
      if (!link) return;

      const otherSocketId = type === 'from' ? link.to : link.from;
      const otherSocket = ctx.sockets.get(otherSocketId);
      if (!otherSocket) return;

      const otherNodeWorldPos = ctx.getWorldPosition(otherSocket.entityId);
      const otherPos = new Vec2(
        otherNodeWorldPos.x + otherSocket.offset.x,
        otherNodeWorldPos.y + otherSocket.offset.y
      );

      setPendingLink({
        fromId: otherSocketId,
        fromPos: otherPos,
        toPos: new Vec2(
          (x - rect.left - transform.x) / transform.k,
          (y - rect.top - transform.y) / transform.k
        ),
        isValid: true
      });

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const touches = (moveEvent as TouchEvent).touches;
        const clientX = touches ? (touches[0]?.clientX ?? 0) : (moveEvent as MouseEvent).clientX;
        const clientY = touches ? (touches[0]?.clientY ?? 0) : (moveEvent as MouseEvent).clientY;
        const target = touches
          ? document.elementFromPoint(clientX, clientY)
          : (moveEvent.target as HTMLElement);
        const targetSocketEl = target?.closest('.anode-socket') as HTMLElement;
        let isValid = true;

        if (targetSocketEl) {
          const toId = parseInt(targetSocketEl.getAttribute('data-socket-id') || '');
          const toSocket = ctx.sockets.get(toId);
          if (toSocket) {
            // Check if we can link from the static end to the new target
            // If type === 'from', we are moving the 'from' end, so we check if otherSocket (which is 'to') can link with new 'from'
            // canLink(from, to)
            const newFrom = type === 'from' ? toSocket : otherSocket;
            const newTo = type === 'from' ? otherSocket : toSocket;
            isValid =
              ctx.canLink(newFrom, newTo) &&
              (!isValidConnection || isValidConnection(newFrom, newTo, ctx));
          }
        }

        setPendingLink((prev) =>
          prev
            ? {
                ...prev,
                toPos: new Vec2(
                  (clientX - rect.left - transform.x) / transform.k,
                  (clientY - rect.top - transform.y) / transform.k
                ),
                isValid
              }
            : null
        );
      };

      const onUp = (upEvent: MouseEvent | TouchEvent) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);

        let target: HTMLElement | null = null;
        const changedTouches = (upEvent as TouchEvent).changedTouches;
        if (changedTouches) {
          const touch = changedTouches[0];
          target = touch
            ? (document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement)
            : null;
        } else {
          target = upEvent.target as HTMLElement;
        }

        const targetSocketEl = target?.closest('.anode-socket') as HTMLElement;
        if (targetSocketEl) {
          const newSocketId = parseInt(targetSocketEl.getAttribute('data-socket-id') || '');
          const newSocket = ctx.sockets.get(newSocketId);

          if (newSocket) {
            const newFrom = type === 'from' ? newSocket : otherSocket;
            const newTo = type === 'from' ? otherSocket : newSocket;

            if (
              ctx.canLink(newFrom, newTo) &&
              (!isValidConnection || isValidConnection(newFrom, newTo, ctx))
            ) {
              ctx.updateLink(link, newFrom.id, newTo.id);
            }
          }
        }
        setPendingLink(null);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    };

    const el = worldRef.current;
    el?.addEventListener('anode-link-start', handleLinkStart);
    el?.addEventListener('anode-link-reconnect', handleReconnect);
    return () => {
      el?.removeEventListener('anode-link-start', handleLinkStart);
      el?.removeEventListener('anode-link-reconnect', handleReconnect);
    };
  }, [ctx, transform, defaultLinkKind, onConnect, isValidConnection]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    if (e.target !== worldRef.current) return;

    if (e.altKey) {
      const rect = worldRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      setSelectionBox({ startX, startY, endX: startX, endY: startY });

      const onMouseMove = (moveEvent: MouseEvent) => {
        setSelectionBox((prev) =>
          prev
            ? {
                ...prev,
                endX: moveEvent.clientX - rect.left,
                endY: moveEvent.clientY - rect.top
              }
            : null
        );
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        setSelectionBox((prev) => {
          if (!prev) return null;

          const rect = worldRef.current?.getBoundingClientRect();
          if (!rect) return null;

          const x1 = Math.min(prev.startX, prev.endX);
          const y1 = Math.min(prev.startY, prev.endY);
          const x2 = Math.max(prev.startX, prev.endX);
          const y2 = Math.max(prev.startY, prev.endY);

          // Convert screen box to world box
          const worldTopLeft = screenToWorld(x1 + rect.left, y1 + rect.top);
          const worldBottomRight = screenToWorld(x2 + rect.left, y2 + rect.top);

          const queryRect = new Rect(
            worldTopLeft.x,
            worldTopLeft.y,
            worldBottomRight.x - worldTopLeft.x,
            worldBottomRight.y - worldTopLeft.y
          );

          const selectedIds = ctx.quadTree.query(queryRect);
          setSelection({ nodes: new Set(selectedIds), links: new Set() });

          return null;
        });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      return;
    }

    setSelection({ nodes: new Set(), links: new Set() });

    const startX = e.clientX - transform.x;
    const startY = e.clientY - transform.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setTransform({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
        k: transformRef.current.k
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (e.target !== worldRef.current) return;
      setSelection({ nodes: new Set(), links: new Set() });
      const touch = e.touches[0];
      if (!touch) return;
      const startX = touch.clientX - transform.x;
      const startY = touch.clientY - transform.y;

      const onTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length === 1) {
          const touch = moveEvent.touches[0];
          if (!touch) return;
          setTransform({
            x: touch.clientX - startX,
            y: touch.clientY - startY,
            k: transformRef.current.k
          });
        }
      };

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      if (!t1 || !t2) return;
      const initialDist = getDistance(t1, t2);
      const initialCenter = getCenter(t1, t2);
      const initialTransform = { ...transformRef.current };

      const onTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length === 2) {
          const mt1 = moveEvent.touches[0];
          const mt2 = moveEvent.touches[1];
          if (!mt1 || !mt2) return;
          const currentDist = getDistance(mt1, mt2);
          const currentCenter = getCenter(mt1, mt2);

          const factor = currentDist / initialDist;
          const newK = Math.min(Math.max(initialTransform.k * factor, 0.1), 5);

          const rect = worldRef.current?.getBoundingClientRect();
          if (!rect) return;

          const zoomCenterX = initialCenter.x - rect.left;
          const zoomCenterY = initialCenter.y - rect.top;

          const beforeKCenterX = (zoomCenterX - initialTransform.x) / initialTransform.k;
          const beforeKCenterY = (zoomCenterY - initialTransform.y) / initialTransform.k;

          const dx = currentCenter.x - initialCenter.x;
          const dy = currentCenter.y - initialCenter.y;

          const newX = zoomCenterX - beforeKCenterX * newK + dx;
          const newY = zoomCenterY - beforeKCenterY * newK + dy;

          setTransform({ x: newX, y: newY, k: newK });
          if (moveEvent.cancelable) moveEvent.preventDefault();
        }
      };

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }
  };

  return (
    <div
      ref={worldRef}
      className="anode-world"
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
  );
};
