import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Context } from 'anode';

const AnodeReactContext = createContext<Context | null>(null);

export const useAnode = () => {
  const ctx = useContext(AnodeReactContext);
  if (!ctx) {
    throw new Error('useAnode must be used within an AnodeProvider');
  }
  return ctx;
};

export const AnodeProvider: React.FC<{ children: React.ReactNode; context?: Context }> = ({
  children,
  context
}) => {
  const [ctx] = useState(() => context ?? new Context());

  return <AnodeReactContext.Provider value={ctx}>{children}</AnodeReactContext.Provider>;
};
