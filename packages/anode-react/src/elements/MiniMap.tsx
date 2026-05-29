import React from 'react';
import { useAnode, useViewport } from '../context.js';
import { useGraphBounds } from '../hooks.js';

/**
 * A simplified bird's-eye view of the entire graph, providing
 * context and a visual indicator of the current viewport.
 *
 * @example
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
  const bounds = useGraphBounds();

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
