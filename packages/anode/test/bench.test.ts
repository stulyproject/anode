import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context.js';
import { SocketKind } from '../src/core/elements.js';
import { Rect } from '../src/core/layout.js';

describe('Anode Performance', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  describe('Massive Graph Operations', () => {
    it('should handle creation and linking of 1000 nodes efficiently', () => {
      const start = performance.now();

      // 1. Create 1000 nodes each with 1 input and 1 output
      for (let i = 0; i < 1000; i++) {
        const node = ctx.newEntity({ i });
        ctx.newSocket(node, SocketKind.OUTPUT, 'out');
        ctx.newSocket(node, SocketKind.INPUT, 'in');
      }

      const afterNodes = performance.now();
      console.log(`[BENCH] Create 1000 nodes and sockets: ${(afterNodes - start).toFixed(2)}ms`);

      // 2. Link them sequentially
      for (let i = 0; i < 999; i++) {
        const outNode = ctx.entities.get(i);
        const inNode = ctx.entities.get(i + 1);

        if (outNode && inNode) {
          const outS = Array.from(outNode.sockets.values()).find(
            (s) => s.kind === SocketKind.OUTPUT
          );
          const inS = Array.from(inNode.sockets.values()).find((s) => s.kind === SocketKind.INPUT);

          if (outS && inS) ctx.newLink({ from: outS, to: inS });
        }
      }

      const afterLinks = performance.now();
      console.log(
        `[BENCH] Link 1000 nodes sequentially: ${(afterLinks - afterNodes).toFixed(2)}ms`
      );

      // 3. Performance expectations (Adjust based on environment)
      expect(ctx.entities.size).toBe(1000);
      expect(ctx.links.size).toBe(999);

      // 4. Test spatial query performance
      const qStart = performance.now();
      ctx.quadTree.query(new Rect(0, 0, 100, 100));
      const qEnd = performance.now();
      console.log(`[BENCH] Spatial query over 1000 nodes: ${(qEnd - qStart).toFixed(2)}ms`);

      // 5. Test serialization performance
      const sStart = performance.now();
      const json = ctx.toJSON();
      const sEnd = performance.now();
      console.log(`[BENCH] Serialize 1000 nodes: ${(sEnd - sStart).toFixed(2)}ms`);

      const dStart = performance.now();
      ctx.fromJSON(json);
      const dEnd = performance.now();
      console.log(`[BENCH] Deserialize 1000 nodes: ${(dEnd - dStart).toFixed(2)}ms`);
    });
  });
});
