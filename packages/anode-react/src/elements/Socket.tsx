import React, { useEffect, useRef, useState } from 'react';
import { useAnode } from '../context.js';
import { SocketKind } from 'anode';

export interface SocketProps {
  entityId: number;
  kind: SocketKind;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Socket: React.FC<SocketProps> = ({ entityId, kind, name, className, style }) => {
  const ctx = useAnode();
  const ref = useRef<HTMLDivElement>(null);
  const [socketId, setSocketId] = useState<number | null>(null);

  useEffect(() => {
    const entity = ctx.entities.get(entityId);
    if (!entity) return;

    const socket = ctx.newSocket(entity, kind, name);
    setSocketId(socket.id);

    return () => {
      ctx.dropSocket(socket);
    };
  }, [ctx, entityId, kind, name]);

  useEffect(() => {
    const updateOffset = () => {
      if (!ref.current || socketId === null) return;
      const entity = ctx.entities.get(entityId);
      if (!entity) return;

      const socket = ctx.sockets.get(socketId);
      if (!socket) return;

      const rect = ref.current.getBoundingClientRect();
      const parentNode = ref.current.closest('.anode-node');
      if (!parentNode) return;

      const parentRect = parentNode.getBoundingClientRect();

      socket.offset.set(
        rect.left + rect.width / 2 - (parentRect.left + parentRect.width / 2),
        rect.top + rect.height / 2 - (parentRect.top + parentRect.height / 2)
      );
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [ctx, entityId, socketId]);

  return (
    <div
      ref={ref}
      className={`anode-socket ${className || ''}`}
      data-socket-id={socketId}
      data-socket-kind={kind}
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: kind === SocketKind.INPUT ? '#4ade80' : '#f87171',
        border: '2px solid white',
        cursor: 'crosshair',
        ...style
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (socketId === null) return;

        // Dispatch custom event for World to handle
        const event = new CustomEvent('anode-link-start', {
          bubbles: true,
          detail: { socketId, kind, x: e.clientX, y: e.clientY }
        });
        ref.current?.dispatchEvent(event);
      }}
    />
  );
};
