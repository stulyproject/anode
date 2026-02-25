import React from 'react';
import { useViewport, useAnode } from '../context.js';

export const Controls: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { viewport, setViewport } = useViewport();
  const ctx = useAnode();

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

    // We assume the World is roughly the window size for now
    // or we could pass world dimensions to this component.
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

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
        gap: 5,
        zIndex: 100,
        ...style
      }}
    >
      <button onClick={onZoomIn} style={buttonStyle}>
        +
      </button>
      <button onClick={onZoomOut} style={buttonStyle}>
        -
      </button>
      <button onClick={onFitView} style={buttonStyle}>
        T
      </button>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
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
