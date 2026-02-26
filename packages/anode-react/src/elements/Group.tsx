import React, { useState } from 'react';
import { useAnode, useViewport } from '../context.js';
import { Group as GroupCore, Rect, Vec2 } from '@stuly/anode';

export interface GroupProps {
  id: number;
  children?: React.ReactNode;
}

export const Group: React.FC<GroupProps> = ({ id, children }) => {
  const ctx = useAnode();
  const { viewport } = useViewport();
  const group = ctx.groups.get(id);
  const [isDragging, setIsDragging] = useState(false);

  if (!group) return null;

  const worldPos = ctx.getGroupWorldPosition(id);

  // Calculate bounds based on children
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const calculateBounds = (g: GroupCore) => {
    for (const eid of g.entities) {
      const entity = ctx.entities.get(eid);
      if (entity) {
        const p = ctx.getWorldPosition(eid);
        minX = Math.min(minX, p.x - 50);
        minY = Math.min(minY, p.y - 50);
        maxX = Math.max(maxX, p.x + 150); // Default sizes if not known
        maxY = Math.max(maxY, p.y + 100);
      }
    }
    for (const gid of g.groups) {
      const childGroup = ctx.groups.get(gid);
      if (childGroup) calculateBounds(childGroup);
    }
  };

  calculateBounds(group);

  const hasChildren = minX !== Infinity;
  const width = hasChildren ? maxX - minX : 200;
  const height = hasChildren ? maxY - minY : 200;
  const x = hasChildren ? minX : worldPos.x;
  const y = hasChildren ? minY : worldPos.y;

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / viewport.k;
      const dy = (moveEvent.clientY - startY) / viewport.k;

      // We need to be careful with moveGroup because it's incremental
      // But we are using startX/startY which is absolute from drag start.
      // So we should track the previous dx/dy or just pass the delta since last move.
    };

    // Better: use delta
    let lastX = e.clientX;
    let lastY = e.clientY;

    const onMouseMoveDelta = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - lastX) / viewport.k;
      const dy = (moveEvent.clientY - lastY) / viewport.k;
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;

      ctx.moveGroup(group, dx, dy);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMoveDelta);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMoveDelta);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className="anode-group"
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        background: 'rgba(0, 0, 0, 0.05)',
        border: '1px dashed #ccc',
        borderRadius: 8,
        zIndex: -1, // Below nodes
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto'
      }}
    >
      <div style={{ padding: 8, fontSize: 12, color: '#999', userSelect: 'none' }}>
        {group.name || `Group ${id}`}
      </div>
      {children}
    </div>
  );
};
