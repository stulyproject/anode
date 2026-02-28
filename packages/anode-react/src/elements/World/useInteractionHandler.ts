import { useState, useEffect, useRef } from 'react';
import { Vec2, LinkKind, Rect, Context } from '@stuly/anode';
import { useAnode, useViewport, useSelection } from '../../context.js';
import { getDistance, getCenter } from './ViewportManager.js';

/** Options for the InteractionHandler. */
export interface InteractionHandlerProps {
  /** Reference to the world container element. */
  worldRef: React.RefObject<HTMLDivElement | null>;

  /** Callback to intercept and handle link completion. */
  onConnect?: ((fromId: number, toId: number, ctx: Context<any>) => void) | undefined;

  /** Callback to validate connections before they are finalized. */
  isValidConnection?: ((from: any, to: any, ctx: Context<any>) => boolean) | undefined;

  /** Default visual style for newly created links. */
  defaultLinkKind?: LinkKind | undefined;
}

/**
 * Hook to manage complex mouse and touch interactions (selection, dragging, and link creation).
 *
 * **Behaviors:**
 * 1. **Selection Marquee (Alt+Drag):** Allows box-selecting multiple nodes using the QuadTree spatial query.
 * 2. **World Panning (Drag):** Drags the entire canvas if clicking on empty space.
 * 3. **Link Creation (Drag from Socket):** Handles the "drag-to-connect" gesture.
 *    - Displays a real-time preview of the pending link.
 *    - Validates targets on-the-fly via the engine and the `isValidConnection` prop.
 * 4. **Touch Support:** Supports single-touch panning and pinch-to-zoom.
 *
 * **Side Effects:**
 * 1. Dispatches and listens for custom `anode-link-start` and `anode-link-reconnect` DOM events.
 * 2. Updates global selection and viewport contexts.
 */
export const useInteractionHandler = ({
  worldRef,
  onConnect,
  isValidConnection,
  defaultLinkKind = LinkKind.BEZIER
}: InteractionHandlerProps) => {
  const ctx = useAnode();
  const { viewport: transform, setViewport: setTransform, screenToWorld } = useViewport();
  const { setSelection } = useSelection();
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [pendingLink, setPendingLink] = useState<{
    fromId: number;
    fromPos: Vec2;
    toPos: Vec2;
    isValid: boolean;
  } | null>(null);

  const transformRef = useRef(transform);
  transformRef.current = transform;

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
          (x - rect.left - transformRef.current.x) / transformRef.current.k,
          (y - rect.top - transformRef.current.y) / transformRef.current.k
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
                  (clientX - rect.left - transformRef.current.x) / transformRef.current.k,
                  (clientY - rect.top - transformRef.current.y) / transformRef.current.k
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
                ctx.newLink({ from, to, kind: defaultLinkKind });
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
          (x - rect.left - transformRef.current.x) / transformRef.current.k,
          (y - rect.top - transformRef.current.y) / transformRef.current.k
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
                  (clientX - rect.left - transformRef.current.x) / transformRef.current.k,
                  (clientY - rect.top - transformRef.current.y) / transformRef.current.k
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
  }, [ctx, worldRef, defaultLinkKind, onConnect, isValidConnection]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.target !== worldRef.current) return;

    if (e.altKey) {
      const rect = worldRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      let currentX = startX;
      let currentY = startY;

      setSelectionBox({ startX, startY, endX: startX, endY: startY });

      const onMouseMove = (moveEvent: MouseEvent) => {
        currentX = moveEvent.clientX - rect.left;
        currentY = moveEvent.clientY - rect.top;
        setSelectionBox({ startX, startY, endX: currentX, endY: currentY });
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const x1 = Math.min(startX, currentX);
        const y1 = Math.min(startY, currentY);
        const x2 = Math.max(startX, currentX);
        const y2 = Math.max(startY, currentY);

        const worldRect = worldRef.current?.getBoundingClientRect();
        if (worldRect) {
          const worldTopLeft = screenToWorld(x1 + worldRect.left, y1 + worldRect.top);
          const worldBottomRight = screenToWorld(x2 + worldRect.left, y2 + worldRect.top);

          const queryRect = new Rect(
            worldTopLeft.x,
            worldTopLeft.y,
            worldBottomRight.x - worldTopLeft.x,
            worldBottomRight.y - worldTopLeft.y
          );

          const selectedIds = ctx.quadTree.query(queryRect);
          setSelection({ nodes: new Set(selectedIds), links: new Set() });
        }

        setSelectionBox(null);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      return;
    }

    setSelection({ nodes: new Set(), links: new Set() });

    const startX = e.clientX - transformRef.current.x;
    const startY = e.clientY - transformRef.current.y;

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
      const startX = touch.clientX - transformRef.current.x;
      const startY = touch.clientY - transformRef.current.y;

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

  return { onMouseDown, onTouchStart, selectionBox, pendingLink };
};
