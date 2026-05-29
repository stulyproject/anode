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

    // Force re-render when this specific entity moves in the core engine
    const onMove = (movingEntity: Entity) => {
      if (movingEntity.id === id) {
        setTick((t) => t + 1);
      }
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

        let currentSelection = selection;
        if (e.shiftKey) {
          setSelection((prev) => {
            const next = new Set(prev.nodes);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            const updated = { ...prev, nodes: next };
            currentSelection = updated;
            return updated;
          });
        } else {
          if (!selection.nodes.has(id)) {
            const updated = { nodes: new Set([id]), links: new Set<number>() };
            setSelection(updated);
            currentSelection = updated;
          }
        }

        const startX = e.clientX;
        const startY = e.clientY;

        const startPositions = new Map<number, { x: number; y: number }>();
        const nodesToMove = Array.from(currentSelection.nodes)
          .map((nid) => ctx.entities.get(nid))
          .filter((n): n is Entity => !!n);

        for (const node of nodesToMove) {
          startPositions.set(node.id, { x: node.position.x, y: node.position.y });
        }

        let hasDragged = false;

        const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
          const dx = (moveEvent.clientX - startX) / viewport.k;
          const dy = (moveEvent.clientY - startY) / viewport.k;

          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            hasDragged = true;
          }

          for (const node of nodesToMove) {
            const startPos = startPositions.get(node.id);
            if (startPos) {
              let newX = startPos.x + dx;
              let newY = startPos.y + dy;

              // Snap to grid (15px)
              const gridSize = 15;
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;

              node.move(newX, newY);
            }
          }
        };

        const onMouseUp = () => {
          setIsDragging(false);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          if (!hasDragged && !e.shiftKey) {
            setSelection({ nodes: new Set([id]), links: new Set() });
          }

          if (hasDragged) {
            const doActions: any[] = [];
            const undoActions: any[] = [];

            for (const node of nodesToMove) {
              const startPos = startPositions.get(node.id);
              if (startPos) {
                const finalPos = { x: node.position.x, y: node.position.y };
                if (startPos.x !== finalPos.x || startPos.y !== finalPos.y) {
                  doActions.push({
                    type: 'MOVE_ENTITY',
                    id: node.id,
                    from: { x: startPos.x, y: startPos.y },
                    to: { x: finalPos.x, y: finalPos.y }
                  });
                  undoActions.push({
                    type: 'MOVE_ENTITY',
                    id: node.id,
                    from: { x: finalPos.x, y: finalPos.y },
                    to: { x: startPos.x, y: startPos.y }
                  });
                }
              }
            }

            if (doActions.length > 0) {
              ctx.record(doActions, undoActions, 'Move Nodes');
              ctx.notifyBulkChange();
            }
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.stopPropagation();
      }}
      onTouchStart={(e: TouchEvent) => {
        setIsDragging(true);

        let currentSelection = selection;
        if (!selection.nodes.has(id)) {
          const updated = { nodes: new Set([id]), links: new Set<number>() };
          setSelection(updated);
          currentSelection = updated;
        }

        const touch = e.touches[0];
        if (!touch) return;
        const startX = touch.clientX;
        const startY = touch.clientY;

        const startPositions = new Map<number, { x: number; y: number }>();
        const nodesToMove = Array.from(currentSelection.nodes)
          .map((nid) => ctx.entities.get(nid))
          .filter((n): n is Entity => !!n);

        for (const node of nodesToMove) {
          startPositions.set(node.id, { x: node.position.x, y: node.position.y });
        }

        let hasDragged = false;

        const onTouchMove = (moveEvent: globalThis.TouchEvent) => {
          const touch = moveEvent.touches[0];
          if (!touch) return;
          const dx = (touch.clientX - startX) / viewport.k;
          const dy = (touch.clientY - startY) / viewport.k;

          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            hasDragged = true;
          }

          for (const node of nodesToMove) {
            const startPos = startPositions.get(node.id);
            if (startPos) {
              let newX = startPos.x + dx;
              let newY = startPos.y + dy;

              const gridSize = 15;
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;

              node.move(newX, newY);
            }
          }
          if (moveEvent.cancelable) moveEvent.preventDefault();
        };

        const onTouchEnd = () => {
          setIsDragging(false);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', onTouchEnd);

          if (hasDragged) {
            const doActions: any[] = [];
            const undoActions: any[] = [];

            for (const node of nodesToMove) {
              const startPos = startPositions.get(node.id);
              if (startPos) {
                const finalPos = { x: node.position.x, y: node.position.y };
                if (startPos.x !== finalPos.x || startPos.y !== finalPos.y) {
                  doActions.push({
                    type: 'MOVE_ENTITY',
                    id: node.id,
                    from: { x: startPos.x, y: startPos.y },
                    to: { x: finalPos.x, y: finalPos.y }
                  });
                  undoActions.push({
                    type: 'MOVE_ENTITY',
                    id: node.id,
                    from: { x: finalPos.x, y: finalPos.y },
                    to: { x: startPos.x, y: startPos.y }
                  });
                }
              }
            }

            if (doActions.length > 0) {
              ctx.record(doActions, undoActions, 'Move Nodes');
              ctx.notifyBulkChange();
            }
          }
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
