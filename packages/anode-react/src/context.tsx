import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Context } from 'anode';

interface Viewport {
  x: number;
  y: number;
  k: number;
}

interface AnodeContextValue {
  ctx: Context;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  selection: {
    nodes: Set<number>;
    links: Set<number>;
  };
  setSelection: React.Dispatch<React.SetStateAction<{ nodes: Set<number>; links: Set<number> }>>;
}

const AnodeReactContext = createContext<AnodeContextValue | null>(null);

export const useAnode = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useAnode must be used within an AnodeProvider');
  }
  return value.ctx;
};

export const useViewport = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useViewport must be used within an AnodeProvider');
  }
  return { viewport: value.viewport, setViewport: value.setViewport };
};

export const useSelection = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useSelection must be used within an AnodeProvider');
  }
  return { selection: value.selection, setSelection: value.setSelection };
};

export const AnodeProvider: React.FC<{ children: React.ReactNode; context?: Context }> = ({
  children,
  context
}) => {
  const [ctx] = useState(() => context ?? new Context());
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, k: 1 });
  const [selection, setSelection] = useState({
    nodes: new Set<number>(),
    links: new Set<number>()
  });

  const value = useMemo(
    () => ({ ctx, viewport, setViewport, selection, setSelection }),
    [ctx, viewport, selection]
  );

  return <AnodeReactContext.Provider value={value}>{children}</AnodeReactContext.Provider>;
};
