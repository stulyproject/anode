import { bench, describe } from 'vitest';
import { Context } from '../src/core/context.js';
import { SocketKind, type Socket } from '../src/core/elements.js';
import { Rect } from '../src/core/layout.js';

describe('Anode Core Benchmarks', () => {
  // 1. Creation & Linking
  describe('Creation & Topology', () => {
    bench('Create 1000 entities with 2 sockets', () => {
      const ctx = new Context();
      for (let i = 0; i < 1000; i++) {
        const node = ctx.newEntity({ i });
        ctx.newSocket(node, SocketKind.OUTPUT, 'out');
        ctx.newSocket(node, SocketKind.INPUT, 'in');
      }
    });

    const ctxLinking = new Context();
    const nodes: any[] = [];
    for (let i = 0; i < 1000; i++) {
      const node = ctxLinking.newEntity({ i });
      ctxLinking.newSocket(node, SocketKind.OUTPUT, 'out');
      ctxLinking.newSocket(node, SocketKind.INPUT, 'in');
      nodes.push(node);
    }

    bench('Link 1000 entities sequentially', () => {
      ctxLinking.batch(() => {
        for (let i = 0; i < 999; i++) {
          const outS = Array.from(nodes[i].sockets.values())[0] as Socket;
          const inS = Array.from(nodes[i + 1].sockets.values())[1] as Socket;
          ctxLinking.newLink({ from: outS, to: inS });
        }
      });
    });
  });

  // 2. Spatial Indexing (The new optimized QuadTree)
  describe('Spatial Operations', () => {
    const ctxSpatial = new Context();
    for (let i = 0; i < 2000; i++) {
      const node = ctxSpatial.newEntity({ i });
      node.move(Math.random() * 5000, Math.random() * 5000);
    }

    bench('Query 2000 nodes (10% viewport)', () => {
      ctxSpatial.quadTree.query(new Rect(0, 0, 500, 500));
    });

    bench('Move 1000 nodes (Incremental QuadTree updates)', () => {
      for (let i = 0; i < 1000; i++) {
        const node = ctxSpatial.entities.get(i);
        node?.move(Math.random() * 5000, Math.random() * 5000);
      }
    });
  });

  // 3. Reactivity & Propagation
  describe('Reactivity', () => {
    const ctxFlow = new Context();
    const n1 = ctxFlow.newEntity({ i: 1 });
    const n2 = ctxFlow.newEntity({ i: 2 });
    const out1 = ctxFlow.newSocket(n1, SocketKind.OUTPUT, 'out');
    const in2 = ctxFlow.newSocket(n2, SocketKind.INPUT, 'in');
    ctxFlow.newLink({ from: out1, to: in2 });

    bench('Direct value propagation (1 link)', () => {
      ctxFlow.setSocketValue(out1.id, Math.random());
    });

    const ctxChain = new Context();
    const chainNodes: { n: any; out: Socket; input: Socket }[] = [];
    for (let i = 0; i < 100; i++) {
      const n = ctxChain.newEntity({ i });
      const out = ctxChain.newSocket(n, SocketKind.OUTPUT, 'out');
      const input = ctxChain.newSocket(n, SocketKind.INPUT, 'in');
      chainNodes.push({ n, out, input });
    }

    for (let i = 0; i < 99; i++) {
      const current = chainNodes[i];
      const next = chainNodes[i + 1];
      if (current && next) {
        ctxChain.newLink({ from: current.out, to: next.input });
        // Manual pipe
        const inId = next.input.id;
        const outId = next.out.id;
        ctxChain.registerSocketValueListener((s, val) => {
          if (s.id === inId) ctxChain.setSocketValue(outId, val);
        });
      }
    }

    bench('Chain propagation (100 links deep)', () => {
      const firstNode = chainNodes[0];
      if (firstNode) {
        ctxChain.setSocketValue(firstNode.out.id, Math.random());
      }
    });
  });

  // 4. State Synchronization
  describe('Serialization & Sync', () => {
    const ctxSync = new Context();
    for (let i = 0; i < 1000; i++) {
      const n = ctxSync.newEntity({ i });
      ctxSync.newSocket(n, SocketKind.OUTPUT, 'out');
    }
    const data = ctxSync.toJSON();

    bench('Serialize 1000 nodes to JSON', () => {
      ctxSync.toJSON();
    });

    bench('Deserialize 1000 nodes from JSON', () => {
      const ctx2 = new Context();
      ctx2.fromJSON(data);
    });

    const actions: any[] = [];
    for (let i = 0; i < 500; i++) {
      actions.push({
        type: 'MOVE_ENTITY',
        id: i,
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 }
      });
    }

    bench('Apply 500 atomic actions', () => {
      ctxSync.apply(actions);
    });
  });

  // 5. Coordinate Resolution
  describe('Coordinate System', () => {
    const ctxNested = new Context();
    let lastGroupId = -1;
    for (let i = 0; i < 50; i++) {
      const g = ctxNested.newGroup(`Group ${i}`);
      if (lastGroupId !== -1) {
        ctxNested.addGroupToGroup(lastGroupId, g.id);
      }
      lastGroupId = g.id;
    }
    const leafNode = ctxNested.newEntity({ leaf: true });
    ctxNested.addToGroup(lastGroupId, leafNode.id);

    bench('Resolve world position (50 levels deep)', () => {
      ctxNested.getWorldPosition(leafNode.id);
    });
  });
});
