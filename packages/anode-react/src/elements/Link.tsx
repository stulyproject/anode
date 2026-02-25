import React, { useEffect, useState } from 'react';
import { useAnode, useSelection } from '../context.js';
import { getLinkPath } from 'anode';

export interface LinkProps {
  id: number;
}

export const Link: React.FC<LinkProps> = ({ id }) => {
  const ctx = useAnode();
  const { selection, setSelection } = useSelection();
  const link = ctx.links.get(id);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!link) return;

    const onUpdate = () => setTick((t) => t + 1);

    // Subscribe to everything that affects the path
    const h1 = ctx.registerEntityMoveListener(onUpdate);
    const h2 = ctx.registerSocketMoveListener(onUpdate);
    const h3 = ctx.registerSocketCreateListener(onUpdate); // Trigger if sockets appear later

    return () => {
      ctx.unregisterListener(h1);
      ctx.unregisterListener(h2);
      ctx.unregisterListener(h3);
    };
  }, [ctx, link]);

  if (!link) return null;

  const d = getLinkPath(ctx, link);
  if (!d) return null;

  const isSelected = selection.links.has(id);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelection((prev) => {
        const next = new Set(prev.links);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...prev, links: next };
      });
    } else {
      setSelection({ nodes: new Set(), links: new Set([id]) });
    }
  };

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Invisible thicker path for easier clicking */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={15} />
      <path
        d={d}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#94a3b8'}
        strokeWidth={isSelected ? 3 : 2}
        transition="stroke 0.2s, stroke-width 0.2s"
      />
    </g>
  );
};
