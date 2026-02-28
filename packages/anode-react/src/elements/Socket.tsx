import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FC,
  type CSSProperties,
  type MouseEvent,
  type TouchEvent
} from 'react';
import { useAnode, useViewport } from '../context.js';
import { SocketKind } from '@stuly/anode';

export interface SocketProps {
  /** The ID of the entity this socket belongs to. */
  entityId: number;

  /** Whether this socket is an INPUT or OUTPUT. */
  kind: SocketKind;

  /** A unique name for the socket within the entity. */
  name?: string;

  /** Optional custom CSS class. */
  className?: string;

  /** Optional custom styles. */
  style?: CSSProperties;
}

/**
 * A connection point component for entities.
 * Dispatches DOM events for the World component to handle drag-to-connect logic.
 */
export const Socket: FC<SocketProps> = ({ entityId, kind, name, className, style }) => {
  const ctx = useAnode();
  const { viewport } = useViewport();
  const ref = useRef<HTMLDivElement>(null);
  const [socketId, setSocketId] = useState<number | null>(null);
  const createdSocketId = useRef<number | null>(null);

  useEffect(() => {
    const entity = ctx.entities.get(entityId);
    if (!entity) return;

    // Check if this socket already exists (e.g. we were culled and came back)
    const existingSocket = Array.from(entity.sockets.values()).find(
      (s) => s.kind === kind && s.name === name
    );

    if (existingSocket) {
      createdSocketId.current = existingSocket.id;
      setSocketId(existingSocket.id);
    } else if (createdSocketId.current === null) {
      const socket = ctx.newSocket(entity, kind, name);
      createdSocketId.current = socket.id;
      setSocketId(socket.id);
    }

    return () => {
      createdSocketId.current = null;
      setSocketId(null);
    };
  }, [ctx, entityId, kind, name]);

  const updateOffset = useCallback(() => {
    const sid = socketId ?? createdSocketId.current;
    if (!ref.current || sid === null) return;
    const entity = ctx.entities.get(entityId);
    if (!entity) return;

    const socket = ctx.sockets.get(sid);
    if (!socket) return;

    const rect = ref.current.getBoundingClientRect();
    const parentNode = ref.current.closest('.anode-node');
    if (!parentNode) return;

    const parentRect = parentNode.getBoundingClientRect();

    // Calculate relative offset from entity center, adjusted for zoom
    socket.offset.set(
      (rect.left + rect.width / 2 - (parentRect.left + parentRect.width / 2)) / viewport.k,
      (rect.top + rect.height / 2 - (parentRect.top + parentRect.height / 2)) / viewport.k
    );
    ctx.notifySocketMove(socket);
  }, [ctx, entityId, socketId, viewport.k]);

  useEffect(() => {
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [updateOffset]);

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
      onMouseDown={(e: MouseEvent) => {
        e.stopPropagation();
        if (socketId === null) return;

        // Dispatch custom event for World component's InteractionHandler
        const event = new CustomEvent('anode-link-start', {
          bubbles: true,
          detail: { socketId, kind, x: e.clientX, y: e.clientY }
        });
        ref.current?.dispatchEvent(event);
      }}
      onTouchStart={(e: TouchEvent) => {
        e.stopPropagation();
        if (socketId === null) return;

        const touch = e.touches[0];
        if (!touch) return;
        const event = new CustomEvent('anode-link-start', {
          bubbles: true,
          detail: { socketId, kind, x: touch.clientX, y: touch.clientY }
        });
        ref.current?.dispatchEvent(event);
      }}
    />
  );
};
