import React from 'react';
import { useViewport } from '../context.js';

export interface BackgroundProps {
  color?: string;
  size?: number;
  gap?: number;
  pattern?: 'dots' | 'lines';
}

/**
 * A decorative grid or dot pattern overlay for the canvas.
 * Automatically pans and scales with the viewport.
 *
 * **Usage:**
 * ```tsx
 * <World>
 *   <Background pattern="dots" color="#ccc" />
 * </World>
 * ```
 */
export const Background: React.FC<BackgroundProps> = ({
  color = '#cbd5e1',
  size = 1,
  gap = 20,
  pattern = 'dots'
}) => {
  const { viewport } = useViewport();

  // Scale the gap and size by the current zoom level (k)
  const scaledGap = gap * viewport.k;
  const scaledSize = size * viewport.k;

  // Offset the background so it pans with the world
  const offsetX = viewport.x % scaledGap;
  const offsetY = viewport.y % scaledGap;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage:
          pattern === 'dots'
            ? `radial-gradient(${color} ${scaledSize}px, transparent 0)`
            : `linear-gradient(to right, ${color} ${Math.max(1, viewport.k)}px, transparent 1px), linear-gradient(to bottom, ${color} ${Math.max(1, viewport.k)}px, transparent 1px)`,
        backgroundSize: `${scaledGap}px ${scaledGap}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`
      }}
    />
  );
};
