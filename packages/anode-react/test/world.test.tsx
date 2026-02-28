import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnodeProvider, useAnode } from '../src/context.js';
import { World } from '../src/elements/World.js';
import type { NodeData } from '../src/elements/World/SyncManager.js';
import { useEffect } from 'react';

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

    // Initial sync and subsequent move should trigger it
    expect(onNodesChange).toHaveBeenCalled();

    const lastCall = onNodesChange.mock.calls[onNodesChange.mock.calls.length - 1];
    if (!lastCall) throw new Error('onNodesChange was not called');

    const nodesArg = lastCall[0] as NodeData[];
    const movedNode = nodesArg.find((n) => n.id === 1);
    expect(movedNode?.position.x).toBe(500);
  });
});
