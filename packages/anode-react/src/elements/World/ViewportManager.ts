import { useEffect, useRef } from 'react';
import { useViewport } from '../../context.js';

/**
 * Hook to manage viewport-level interactions such as panning and zooming.
 *
 * **Behaviors:**
 * 1. **Zooming:** Responds to the `wheel` event to scale the world around the current mouse position.
 *    - Clamps zoom level between `0.1x` and `5x`.
 *    - Uses an exponential zoom factor for smooth scaling.
 * 2. **Panning:** (Controlled in `useInteractionHandler` via mouse/touch drag).
 *
 * **Side Effects:**
 * 1. Registers a non-passive `wheel` listener on the world container to intercept scroll behavior.
 * 2. Synchronizes the shared `ViewportContext` state.
 *
 * @param worldRef Reference to the scrollable world container element.
 * @returns The current viewport transform state (`x`, `y`, `k`).
 */
export const useViewportManager = (worldRef: React.RefObject<HTMLDivElement | null>) => {
  const { viewport: transform, setViewport: setTransform } = useViewport();
  const transformRef = useRef(transform);
  transformRef.current = transform;

  useEffect(() => {
    const el = worldRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const t = transformRef.current;

      const delta = -e.deltaY;
      const factor = Math.pow(1.1, delta / 100);
      const newK = Math.min(Math.max(t.k * factor, 0.1), 5);

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const beforeKMouseX = (mouseX - t.x) / t.k;
      const beforeKMouseY = (mouseY - t.y) / t.k;

      const newX = mouseX - beforeKMouseX * newK;
      const newY = mouseY - beforeKMouseY * newK;

      setTransform({ x: newX, y: newY, k: newK });
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [setTransform, worldRef]);

  return { transform };
};

/** Calculates Euclidean distance between two touch points. */
export const getDistance = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
  return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
};

/** Calculates the midpoint between two touch points. */
export const getCenter = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  };
};
