import React, { useEffect, useRef, useState } from 'react';
import { useAnode } from '../context.js';

export interface NodeProps {
  id: number;
  children?: React.ReactNode;
}

export const Node: React.FC<NodeProps> = ({ id, children }) => {
  const ctx = useAnode();
  const entity = ctx.entities.get(id);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!entity) return;
    const off = entity.onMove(() => {
      setTick((t) => t + 1);
    });
    return off;
  }, [entity]);

  if (!entity) return null;

  return (
    <div
      className="anode-node"
      style={{
        position: 'absolute',
        left: entity.position.x,
        top: entity.position.y,
        transform: 'translate(-50%, -50%)',
        cursor: 'grab'
      }}
      onMouseDown={(e) => {
        const startX = e.clientX;
        const startY = e.clientY;
        const startPosX = entity.position.x;
        const startPosY = entity.position.y;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          entity.move(startPosX + dx, startPosY + dy);
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
};
