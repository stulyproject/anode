import React from 'react';

export interface BackgroundProps {
  color?: string;
  size?: number;
  gap?: number;
  pattern?: 'dots' | 'lines';
}

export const Background: React.FC<BackgroundProps> = ({
  color = '#cbd5e1',
  size = 1,
  gap = 20,
  pattern = 'dots'
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        backgroundImage:
          pattern === 'dots'
            ? `radial-gradient(${color} ${size}px, transparent 0)`
            : `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: `${gap}px ${gap}px`
      }}
    />
  );
};
