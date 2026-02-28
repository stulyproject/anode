import {
  useEffect,
  useState,
  type FC,
  type ReactNode,
  type MouseEvent,
  type TouchEvent
} from 'react';
import { useAnode, useViewport, useSelection } from '../context.js';
import { Entity } from '@stuly/anode';

export interface NodeProps {
  id: number;
  children?: ReactNode;
}

export interface NodeComponentProps {
  entity: Entity;
}

/**
 * A wrapper component for rendering individual nodes in the graph.
 * Handles dragging, selection, and coordinate synchronization.
 */
export const Node: FC<NodeProps> = ({ id, children }) => {
  const ctx = useAnode();
  const { viewport } = useViewport();
  const { selection, setSelection } = useSelection();
  const entity = ctx.entities.get(id);
  const [, setTick] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!entity) return;

    // Force re-render when the entity moves in the core engine
    const onMove = () => {
      setTick((t) => t + 1);
    };

    const handle = ctx.registerEntityMoveListener(onMove);
    return () => {
      ctx.unregisterListener(handle);
    };
  }, [ctx, id, entity]);

  if (!entity) return null;

  const worldPos = ctx.getWorldPosition(id);
  const isSelected = selection.nodes.has(id);

  return (
    <div
      className="anode-node"
      style={{
        position: 'absolute',
        left: worldPos.x,
        top: worldPos.y,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        outline: isSelected ? '2px solid #3b82f6' : 'none',
        borderRadius: 4,
        transition: isDragging ? 'none' : 'left 0.15s ease-out, top 0.15s ease-out',
        zIndex: isDragging ? 1000 : 1
      }}
      onMouseDown={(e: MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);

        if (e.shiftKey) {
          setSelection((prev) => {
            const next = new Set(prev.nodes);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return { ...prev, nodes: next };
          });
        } else {
          setSelection({ nodes: new Set([id]), links: new Set() });
        }

        const startX = e.clientX;
        const startY = e.clientY;
        const startPosX = entity.position.x;
        const startPosY = entity.position.y;

        const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
          const dx = (moveEvent.clientX - startX) / viewport.k;
          const dy = (moveEvent.clientY - startY) / viewport.k;

          let newX = startPosX + dx;
          let newY = startPosY + dy;

          // Snap to grid (15px)
          const gridSize = 15;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;

          entity.move(newX, newY);
        };

        const onMouseUp = () => {
          setIsDragging(false);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.stopPropagation();
      }}
      onTouchStart={(e: TouchEvent) => {
        setIsDragging(true);

        setSelection({ nodes: new Set([id]), links: new Set() });

        const touch = e.touches[0];
        if (!touch) return;
        const startX = touch.clientX;
        const startY = touch.clientY;
        const startPosX = entity.position.x;
        const startPosY = entity.position.y;

        const onTouchMove = (moveEvent: globalThis.TouchEvent) => {
          const touch = moveEvent.touches[0];
          if (!touch) return;
          const dx = (touch.clientX - startX) / viewport.k;
          const dy = (touch.clientY - startY) / viewport.k;

          let newX = startPosX + dx;
          let newY = startPosY + dy;

          const gridSize = 15;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;

          entity.move(newX, newY);
          if (moveEvent.cancelable) moveEvent.preventDefault();
        };

        const onTouchEnd = () => {
          setIsDragging(false);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', onTouchEnd);
        };

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
};
