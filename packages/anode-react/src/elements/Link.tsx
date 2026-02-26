import React, { useEffect, useState } from 'react';
import { useAnode, useSelection, useViewport } from '../context.js';
import { getLinkPath, getLinkPoints, getLinkCenter, Vec2, Link as LinkCore } from '@stuly/anode';

export interface LinkComponentProps {
  id: number;
  link: LinkCore;
}

export interface LinkProps {
  id: number;
  style?: React.CSSProperties;
  component?: React.ComponentType<LinkComponentProps> | undefined;
}

export const Link: React.FC<LinkProps> = ({ id, style, component: Component }) => {
  const ctx = useAnode();
  const { viewport, screenToWorld } = useViewport();
  const { selection, setSelection } = useSelection();
  const link = ctx.links.get(id);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!link) return;

    const onUpdate = () => setTick((t) => t + 1);

    // Subscribe to everything that affects the path
    const h1 = ctx.registerEntityMoveListener(onUpdate);
    const h2 = ctx.registerSocketMoveListener(onUpdate);
    const h3 = ctx.registerSocketCreateListener(onUpdate);
    const h4 = ctx.registerLinkUpdateListener((l) => {
      if (l.id === id) onUpdate();
    });

    return () => {
      ctx.unregisterListener(h1);
      ctx.unregisterListener(h2);
      ctx.unregisterListener(h3);
      ctx.unregisterListener(h4);
    };
  }, [ctx, link, id]);

  if (!link) return null;

  const d = getLinkPath(ctx, link);
  const pts = getLinkPoints(ctx, link);
  const center = getLinkCenter(ctx, link);
  if (!d || !pts) return null;

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

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const newWaypoints = [...link.waypoints, new Vec2(x, y)];
    ctx.setLinkWaypoints(link, newWaypoints);
  };

  const onHandleMouseDown = (e: React.MouseEvent, type: 'from' | 'to') => {
    e.stopPropagation();
    const event = new CustomEvent('anode-link-reconnect', {
      bubbles: true,
      detail: { linkId: id, type, x: e.clientX, y: e.clientY }
    });
    (e.target as HTMLElement).dispatchEvent(event);
  };

  const onWaypointMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialWaypoints = link.waypoints.map((p) => p.clone());

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / viewport.k;
      const dy = (moveEvent.clientY - startY) / viewport.k;

      const updatedWaypoints = initialWaypoints.map((p, i) => {
        if (i === index) {
          return new Vec2(p.x + dx, p.y + dy);
        }
        return p;
      });

      // Update without recording history for every mouse move to avoid flooding
      // We should probably batch this or only record on up.
      link.waypoints = updatedWaypoints;
      setTick((t) => t + 1);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Final update with history recording
      ctx.setLinkWaypoints(link, link.waypoints);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <g onClick={onClick} onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Invisible thicker path for easier clicking */}
        <path d={d} fill="none" stroke="transparent" strokeWidth={15} />
        <path
          d={d}
          fill="none"
          stroke={isSelected ? '#3b82f6' : '#94a3b8'}
          strokeWidth={isSelected ? 3 : 2}
          style={{ transition: 'stroke 0.2s, stroke-width 0.2s', ...style }}
        />

        {isSelected && (
          <>
            <circle
              cx={pts.from.x}
              cy={pts.from.y}
              r={5}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={2}
              onMouseDown={(e) => onHandleMouseDown(e, 'from')}
              style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
            />
            <circle
              cx={pts.to.x}
              cy={pts.to.y}
              r={5}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={2}
              onMouseDown={(e) => onHandleMouseDown(e, 'to')}
              style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
            />
            {link.waypoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#3b82f6"
                onMouseDown={(e) => onWaypointMouseDown(e, i)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newWaypoints = link.waypoints.filter((_, idx) => idx !== i);
                  ctx.setLinkWaypoints(link, newWaypoints);
                }}
                style={{ cursor: 'move', pointerEvents: 'auto' }}
              />
            ))}{' '}
          </>
        )}
      </g>
      {Component && center && (
        <foreignObject
          x={center.x - 50}
          y={center.y - 25}
          width={100}
          height={50}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto'
            }}
          >
            <Component id={id} link={link} />
          </div>
        </foreignObject>
      )}
    </>
  );
};
