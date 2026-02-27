import React, { useMemo } from 'react';
import { useAnode, useViewport } from '../context.js';

/**
 * A simplified bird's-eye view of the entire graph, providing
 * context and a visual indicator of the current viewport.
 *
 * **Usage:**
 * ```tsx
 * <World>
 *   <MiniMap width={200} height={150} />
 * </World>
 * ```
 */
export const MiniMap: React.FC<{
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ width = 200, height = 150, style }) => {
  const ctx = useAnode();
  const { viewport } = useViewport();

  // This is a bit expensive to recalculate on every render,
  // but for a prototype it's fine.
  const bounds = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    if (ctx.entities.size === 0) return { x: 0, y: 0, w: 1000, h: 1000 };

    for (const entity of ctx.entities.values()) {
      const pos = ctx.getWorldPosition(entity.id);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    // Add some padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }, [
    ctx.entities.size,
    Array.from(ctx.entities.values())
      .map((e) => e.position.x + e.position.y)
      .join(',')
  ]);

  const scale = Math.min(width / bounds.w, height / bounds.h);

  return (
    <div
      className="anode-minimap"
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width,
        height,
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid #ccc',
        borderRadius: 4,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 100,
        ...style
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
      >
        {Array.from(ctx.entities.values()).map((entity) => {
          const pos = ctx.getWorldPosition(entity.id);
          return (
            <rect
              key={entity.id}
              x={pos.x - 25}
              y={pos.y - 25}
              width={50}
              height={50}
              fill="#94a3b8"
            />
          );
        })}
        {/* Viewport indicator */}
        <rect
          x={-viewport.x / viewport.k}
          y={-viewport.y / viewport.k}
          width={width / (scale * viewport.k)}
          height={height / (scale * viewport.k)}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3b82f6"
          strokeWidth={2 / scale}
        />
      </svg>
    </div>
  );
};
