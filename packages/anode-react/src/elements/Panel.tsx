import React from 'react';

export type PanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const Panel: React.FC<{
  position?: PanelPosition;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ position = 'top-left', children, style }) => {
  const getPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top-left':
        return { top: 20, left: 20 };
      case 'top-right':
        return { top: 20, right: 20 };
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'bottom-right':
        return { bottom: 20, right: 20 };
    }
  };

  return (
    <div
      className={`anode-panel anode-panel-${position}`}
      style={{
        position: 'absolute',
        zIndex: 100,
        ...getPositionStyle(),
        ...style
      }}
    >
      {children}
    </div>
  );
};
