import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  type RefObject
} from 'react';
import { Context } from '@stuly/anode';

interface Viewport {
  x: number;
  y: number;
  k: number;
}

interface AnodeContextValue {
  ctx: Context;
  worldRef: RefObject<HTMLDivElement | null>;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  setScreenToWorld: Dispatch<
    SetStateAction<(clientX: number, clientY: number) => { x: number; y: number }>
  >;
  selection: {
    nodes: Set<number>;
    links: Set<number>;
  };
  setSelection: Dispatch<SetStateAction<{ nodes: Set<number>; links: Set<number> }>>;
}

/**
 * Internal context for Anode's React state, including the engine instance,
 * viewport transformation, and selection state.
 */
export const AnodeReactContext = createContext<AnodeContextValue | null>(null);

/**
 * Accesses the underlying headless Anode engine instance.
 *
 * @returns The `Context` instance for direct graph manipulation.
 */
export const useAnode = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useAnode must be used within an AnodeProvider');
  }
  return value.ctx;
};

/**
 * Accesses the current viewport transformation (pan/zoom) and coordinate
 * conversion utilities.
 *
 * @returns An object containing the current `viewport` and functions to update it.
 */
export const useViewport = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useViewport must be used within an AnodeProvider');
  }
  return {
    viewport: value.viewport,
    setViewport: value.setViewport,
    screenToWorld: value.screenToWorld
  };
};

/**
 * Accesses the current selection state for nodes and links.
 *
 * @returns An object containing the `selection` sets and a `setSelection` updater.
 */
export const useSelection = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useSelection must be used within an AnodeProvider');
  }
  return { selection: value.selection, setSelection: value.setSelection };
};

/**
 * Accesses the reference to the main World container element.
 * Useful for measuring container dimensions or targeting DOM events.
 */
export const useWorldRef = () => {
  const value = useContext(AnodeReactContext);
  if (!value) {
    throw new Error('useWorldRef must be used within an AnodeProvider');
  }
  return value.worldRef;
};

export interface AnodeProviderProps {
  children: ReactNode;
  /** Optional existing context instance to use. */
  context?: Context;
}

/**
 * The root provider for any Anode React application.
 * Wraps the internal headless engine and provides reactive state for
 * viewport and selection.
 *
 * @example
 * ```tsx
 * <AnodeProvider>
 *   <World>
 *     <Background />
 *   </World>
 * </AnodeProvider>
 * ```
 */
export const AnodeProvider: FC<AnodeProviderProps> = ({ children, context }) => {
  // Use lazy initializer to ensure Context is only created once
  const [ctx] = useState(() => context ?? new Context());
  const worldRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, k: 1 });
  const [screenToWorld, setScreenToWorld] = useState<
    (clientX: number, clientY: number) => { x: number; y: number }
  >(() => (x: number, y: number) => ({ x, y }));
  const [selection, setSelection] = useState({
    nodes: new Set<number>(),
    links: new Set<number>()
  });

  const value = useMemo(
    () => ({
      ctx,
      worldRef,
      viewport,
      setViewport,
      screenToWorld,
      setScreenToWorld,
      selection,
      setSelection
    }),
    [ctx, worldRef, viewport, screenToWorld, selection]
  );

  return <AnodeReactContext.Provider value={value}>{children}</AnodeReactContext.Provider>;
};
