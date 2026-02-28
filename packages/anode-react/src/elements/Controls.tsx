import React from 'react';
import { useViewport, useAnode, useWorldRef } from '../context.js';

/**
 * A floating UI control panel providing standard canvas interactions
 * like zooming in/out and fitting all nodes into the current view.
 *
 * @example
 * ```tsx
 * <World>
 *   <Controls />
 * </World>
 * ```
 */
export const Controls: React.FC<{
  style?: React.CSSProperties;
  buttonStyleOverride?: React.CSSProperties;
}> = ({ style, buttonStyleOverride }) => {
  const finalButtonStyle = {
    ...buttonStyle,
    ...buttonStyleOverride
  };
  const { viewport, setViewport } = useViewport();
  const ctx = useAnode();
  const worldRef = useWorldRef();

  const onZoomIn = () => {
    setViewport({ ...viewport, k: Math.min(viewport.k * 1.2, 5) });
  };

  const onZoomOut = () => {
    setViewport({ ...viewport, k: Math.max(viewport.k / 1.2, 0.1) });
  };

  const onFitView = () => {
    if (ctx.entities.size === 0) {
      setViewport({ x: 0, y: 0, k: 1 });
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const entity of ctx.entities.values()) {
      const pos = ctx.getWorldPosition(entity.id);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    const padding = 50;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;

    const container = worldRef.current;
    const containerW = container ? container.clientWidth : window.innerWidth;
    const containerH = container ? container.clientHeight : window.innerHeight;

    const k = Math.min(containerW / w, containerH / h, 1);
    const x = (containerW - (maxX + minX) * k) / 2;
    const y = (containerH - (maxY + minY) * k) / 2;

    setViewport({ x, y, k });
  };

  return (
    <div
      className="anode-controls"
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        gap: 5,
        ...style
      }}
    >
      <button onClick={onZoomIn} style={finalButtonStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-plus-icon lucide-plus"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>
      <button onClick={onZoomOut} style={finalButtonStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-minus-icon lucide-minus"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
      <button onClick={onFitView} style={finalButtonStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-maximize-icon lucide-maximize"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  padding: 2,
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 'bold'
};
