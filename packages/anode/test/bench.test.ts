import { describe, it, beforeEach } from 'vitest';
import { Context } from '../src/core/context';
import { SocketKind } from '../src/core/elements';
import { Rect } from '../src/core/layout';

describe('Anode Performance', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  const runBench = (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[BENCH] ${name}: ${(end - start).toFixed(2)}ms`);
  };

  it('Massive Graph Operations', () => {
    const COUNT = 1000;

    ctx.batch(() => {
      runBench(`Create ${COUNT} nodes and sockets`, () => {
        for (let i = 0; i < COUNT; i++) {
          const node = ctx.newEntity({ i });
          ctx.newSocket(node, SocketKind.OUTPUT, 'out');
          ctx.newSocket(node, SocketKind.INPUT, 'in');
        }
      });

      const nodes = Array.from(ctx.entities.values());
      runBench(`Link ${COUNT} nodes sequentially`, () => {
        for (let i = 0; i < COUNT - 1; i++) {
          const outS = Array.from(nodes[i].sockets.values()).find(
            (s) => s.kind === SocketKind.OUTPUT
          );
          const inS = Array.from(nodes[i + 1].sockets.values()).find(
            (s) => s.kind === SocketKind.INPUT
          );
          if (outS && inS) ctx.newLink(outS, inS);
        }
      });
    }, 'Batch Initialization');

    runBench(`Spatial query over ${COUNT} nodes`, () => {
      // Query a small area in the middle of a sparse field
      ctx.quadTree.query(new Rect(0, 0, 100, 100));
    });

    let json: any;
    runBench(`Serialize ${COUNT} nodes`, () => {
      json = ctx.toJSON();
    });

    runBench(`Deserialize ${COUNT} nodes`, () => {
      const newCtx = new Context();
      newCtx.fromJSON(json);
    });
  }, 30000);
});
