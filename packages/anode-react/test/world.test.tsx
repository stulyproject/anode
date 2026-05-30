import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnodeProvider, useAnode } from '../src/context.js';
import { World } from '../src/elements/World.js';
import type { NodeData } from '../src/elements/World/SyncManager.js';
import { useEffect } from 'react';
import { Socket } from '../src/elements/Socket.js';
import { SocketKind } from '@stuly/anode';

const Mover = () => {
  const ctx = useAnode();
  useEffect(() => {
    // Move the node manually in the engine
    const entity = ctx.entities.get(1);
    if (entity) {
      entity.move(500, 500);
    }
  }, [ctx]);
  return null;
};

describe('World Component', () => {
  it('should render nodes from props', () => {
    const nodes: NodeData[] = [
      { id: 1, position: { x: 100, y: 100 }, data: { label: 'Test Node' } }
    ];

    render(
      <AnodeProvider>
        <World nodes={nodes} />
      </AnodeProvider>
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('should sync changes from internal engine to onNodesChange', async () => {
    const onNodesChange = vi.fn();
    const nodes: NodeData[] = [{ id: 1, position: { x: 0, y: 0 }, data: { label: 'Mover' } }];

    render(
      <AnodeProvider>
        <World nodes={nodes} onNodesChange={onNodesChange} />
        <Mover />
      </AnodeProvider>
    );

    expect(onNodesChange).toHaveBeenCalled();

    const lastCall = onNodesChange.mock.calls[onNodesChange.mock.calls.length - 1];
    if (!lastCall) throw new Error('onNodesChange was not called');

    const nodesArg = lastCall[0] as NodeData[];
    const movedNode = nodesArg.find((n) => n.id === 1);
    expect(movedNode?.position.x).toBe(500);
  });

  it('should update link path simultaneously when a node moves', async () => {
    const nodes: NodeData[] = [
      { id: 1, position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      { id: 2, position: { x: 200, y: 0 }, data: { label: 'Node 2' } }
    ];

    const links = [{ id: 1, source: 1, sourceHandle: 'out', target: 2, targetHandle: 'in' }];

    const CustomNode = ({ entity }: any) => {
      return (
        <div>
          <span>{entity.inner.label}</span>
          <Socket entityId={entity.id} kind={SocketKind.OUTPUT} name="out" />
          <Socket entityId={entity.id} kind={SocketKind.INPUT} name="in" />
        </div>
      );
    };

    let engineContext: any = null;
    const Helper = () => {
      const ctx = useAnode();
      engineContext = ctx;
      return null;
    };

    const container = render(
      <AnodeProvider>
        <World nodes={nodes} links={links} nodeTypes={{ default: CustomNode }} />
        <Helper />
      </AnodeProvider>
    );

    // Get context from provider
    const worldEl = container.container.querySelector('.__anode-world');
    expect(worldEl).toBeInTheDocument();

    expect(engineContext).not.toBeNull();

    // Verify link path initial state
    const pathEl = container.container.querySelector('path:not([stroke="transparent"])');
    expect(pathEl).toBeInTheDocument();
    const initialPath = pathEl?.getAttribute('d');
    expect(initialPath).toBeDefined();

    // Move Node 1 to x=50, y=50
    act(() => {
      engineContext.entities.get(1).move(50, 50);
    });

    // The path should be updated immediately
    const updatedPath = container.container
      .querySelector('path:not([stroke="transparent"])')
      ?.getAttribute('d');
    expect(updatedPath).not.toBe(initialPath);
    expect(updatedPath).toContain('M 50 50');
  });
});
