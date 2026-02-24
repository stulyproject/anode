import React, { useEffect, useState } from 'react';
import { useAnode } from '../context.js';
import { getLinkPath } from 'anode';

export interface LinkProps {
  id: number;
}

export const Link: React.FC<LinkProps> = ({ id }) => {
  const ctx = useAnode();
  const link = ctx.links.get(id);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!link) return;
    const fromSocket = ctx.sockets.get(link.from);
    const toSocket = ctx.sockets.get(link.to);
    if (!fromSocket || !toSocket) return;

    const fromEntity = ctx.entities.get(fromSocket.entityId);
    const toEntity = ctx.entities.get(toSocket.entityId);
    if (!fromEntity || !toEntity) return;

    const onMove = () => setTick((t) => t + 1);

    const off1 = fromEntity.onMove(onMove);
    const off2 = toEntity.onMove(onMove);

    return () => {
      off1();
      off2();
    };
  }, [ctx, link]);

  if (!link) return null;

  const path = getLinkPath(ctx, link);
  if (!path) return null;

  const d = `M ${path.from.x} ${path.from.y} C ${path.control1.x} ${path.control1.y}, ${path.control2.x} ${path.control2.y}, ${path.to.x} ${path.to.y}`;

  return <path d={d} fill="none" stroke="#94a3b8" strokeWidth={2} />;
};
