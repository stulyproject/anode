import React, { useState, useRef, useEffect } from 'react';
import { useAnode, useViewport, useSelection } from '../context.js';
import { useVisibleNodes, useEdges } from '../hooks.js';
import { Node } from './Node.js';
import { Link } from './Link.js';
import { Vec2, Entity, LinkKind } from 'anode';

export interface NodeComponentProps {
  entity: Entity;
}

const DefaultNode: React.FC<NodeComponentProps> = ({ entity }) => (
  <div style={{ padding: 10, background: 'white', border: '1px solid #ccc', borderRadius: 4 }}>
    {entity.inner?.label || `Node ${entity.id}`}
  </div>
);

export const World: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  nodeTypes?: Record<string, React.ComponentType<NodeComponentProps>>;
  defaultLinkKind?: LinkKind;
  onConnect?: (fromId: number, toId: number) => void;
  isValidConnection?: (from: any, to: any) => boolean;
}> = ({
  children,
  style,
  nodeTypes = {},
  defaultLinkKind = LinkKind.SMOOTH_STEP,
  onConnect,
  isValidConnection
}) => {
  const ctx = useAnode();
  const { viewport: transform, setViewport: setTransform } = useViewport();
  const { selection, setSelection } = useSelection();
  const worldRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track container size for accurate spatial culling
  useEffect(() => {
    if (!worldRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(worldRef.current);
    return () => observer.disconnect();
  }, []);

  const entities = useVisibleNodes(containerSize);
  const links = useEdges();
  const [pendingLink, setPendingLink] = useState<{
    fromId: number;
    fromPos: Vec2;
    toPos: Vec2;
    isValid: boolean;
  } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Drop selected nodes
        for (const nid of selection.nodes) {
          const entity = ctx.entities.get(nid);
          if (entity) ctx.dropEntity(entity);
        }
        // Drop selected links
        for (const lid of selection.links) {
          const link = ctx.links.get(lid);
          if (link) ctx.dropLink(link);
        }
        setSelection({ nodes: new Set(), links: new Set() });
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

      const onMouseMove = (moveEvent: MouseEvent) => {
        const target = moveEvent.target as HTMLElement;
        const targetSocketEl = target.closest('.anode-socket') as HTMLElement;
        let isValid = true;

        if (targetSocketEl) {
          const toId = parseInt(targetSocketEl.getAttribute('data-socket-id') || '');
          const from = ctx.sockets.get(socketId);
          const to = ctx.sockets.get(toId);
          if (from && to) {
            isValid = ctx.canLink(from, to) && (!isValidConnection || isValidConnection(from, to));
          }
        }

        setPendingLink((prev) =>
          prev
            ? {
                ...prev,
                toPos: new Vec2(
                  (moveEvent.clientX - rect.left - transform.x) / transform.k,
                  (moveEvent.clientY - rect.top - transform.y) / transform.k
                ),
                isValid
              }
            : null
        );
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const target = upEvent.target as HTMLElement;
        const targetSocket = target.closest('.anode-socket') as HTMLElement;
        if (targetSocket) {
          const toId = parseInt(targetSocket.getAttribute('data-socket-id') || '');
          const from = ctx.sockets.get(socketId);
          const to = ctx.sockets.get(toId);

          if (from && to) {
            const valid =
              ctx.canLink(from, to) && (!isValidConnection || isValidConnection(from, to));
            if (valid) {
              if (onConnect) {
                onConnect(socketId, toId);
              } else {
                ctx.newLink(from, to, defaultLinkKind);
              }
            }
          }
        }
        setPendingLink(null);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const el = worldRef.current;
    el?.addEventListener('anode-link-start', handleLinkStart);
    return () => el?.removeEventListener('anode-link-start', handleLinkStart);
  }, [ctx, transform, defaultLinkKind, onConnect, isValidConnection]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = worldRef.current?.getBoundingClientRect();
    if (!rect) return;

    const delta = -e.deltaY;
    const factor = Math.pow(1.1, delta / 100);
    const newK = Math.min(Math.max(transform.k * factor, 0.1), 5);

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const beforeKMouseX = (mouseX - transform.x) / transform.k;
    const beforeKMouseY = (mouseY - transform.y) / transform.k;

    const newX = mouseX - beforeKMouseX * newK;
    const newY = mouseY - beforeKMouseY * newK;

    setTransform({ x: newX, y: newY, k: newK });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    if (e.target === worldRef.current) {
      setSelection({ nodes: new Set(), links: new Set() });
    } else {
      return;
    }

    const startX = e.clientX - transform.x;
    const startY = e.clientY - transform.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setTransform((prev) => ({
        ...prev,
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={worldRef}
      className="anode-world"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
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
            {links.map((link) => (
              <Link key={link.id} id={link.id} />
            ))}
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
