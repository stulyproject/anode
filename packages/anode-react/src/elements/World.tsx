import React, { useSyncExternalStore, useState, useRef, useEffect } from 'react';
import { useAnode } from '../context.js';
import { Node } from './Node.js';
import { Link } from './Link.js';
import { Vec2, Entity } from 'anode';

export interface NodeComponentProps {
  entity: Entity;
}

const DefaultNode: React.FC<NodeComponentProps> = ({ entity }) => (
  <div style={{ padding: 10, background: 'white', border: '1px solid #ccc', borderRadius: 4 }}>
    {entity.inner?.label || `Node ${entity.id}`}
  </div>
);

const useEntities = () => {
  const ctx = useAnode();
  // We need a stable reference for the entities array between updates
  const store = React.useMemo(() => {
    let snapshot = Array.from(ctx.entities.values());
    return {
      subscribe: (onStoreChange: () => void) => {
        const update = () => {
          snapshot = Array.from(ctx.entities.values());
          onStoreChange();
        };
        const handles = [
          ctx.registerEntityCreateListener(update),
          ctx.registerEntityDropListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

const useLinks = () => {
  const ctx = useAnode();
  const store = React.useMemo(() => {
    let snapshot = Array.from(ctx.links.values());
    return {
      subscribe: (onStoreChange: () => void) => {
        const update = () => {
          snapshot = Array.from(ctx.links.values());
          onStoreChange();
        };
        const handles = [
          ctx.registerLinkCreateListener(update),
          ctx.registerLinkDropListener(update)
        ];
        return () => handles.forEach((h) => ctx.unregisterListener(h));
      },
      getSnapshot: () => snapshot
    };
  }, [ctx]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};

export const World: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  nodeTypes?: Record<string, React.ComponentType<NodeComponentProps>>;
}> = ({ children, style, nodeTypes = {} }) => {
  const ctx = useAnode();
  const entities = useEntities();
  const links = useLinks();
  const worldRef = useRef<HTMLDivElement>(null);
  const [pendingLink, setPendingLink] = useState<{
    fromId: number;
    fromPos: Vec2;
    toPos: Vec2;
  } | null>(null);

  useEffect(() => {
    const handleLinkStart = (e: any) => {
      const { socketId, x, y } = e.detail;
      const rect = worldRef.current?.getBoundingClientRect();
      if (!rect) return;

      const fromSocket = ctx.sockets.get(socketId);
      if (!fromSocket) return;
      const fromEntity = ctx.entities.get(fromSocket.entityId);
      if (!fromEntity) return;

      const fromPos = new Vec2(
        fromEntity.position.x + fromSocket.offset.x,
        fromEntity.position.y + fromSocket.offset.y
      );

      setPendingLink({
        fromId: socketId,
        fromPos,
        toPos: new Vec2(x - rect.left, y - rect.top)
      });

      const onMouseMove = (moveEvent: MouseEvent) => {
        setPendingLink((prev) =>
          prev
            ? {
                ...prev,
                toPos: new Vec2(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top)
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
            ctx.newLink(from, to);
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
  }, [ctx]);

  return (
    <div
      ref={worldRef}
      className="anode-world"
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
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {links.map((link) => (
          <Link key={link.id} id={link.id} />
        ))}
        {pendingLink && (
          <line
            x1={pendingLink.fromPos.x}
            y1={pendingLink.fromPos.y}
            x2={pendingLink.toPos.x}
            y2={pendingLink.toPos.y}
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="4"
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
      {children}
    </div>
  );
};
