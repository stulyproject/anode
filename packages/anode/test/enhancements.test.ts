import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context.js';
import { SocketKind, LinkKind, Vec2 } from '../src/core/elements.js';
import { Rect, getLinkPath } from '../src/core/layout.js';

describe('Core Enhancements', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  describe('QuadTree Dynamic Expansion', () => {
    it('should expand the boundary when inserting far away points', () => {
      expect(ctx.quadTree.boundary.x).toBe(-1000);

      const entity = ctx.newEntity({ label: 'Far Away' });
      entity.move(5000, 5000);

      expect(ctx.quadTree.boundary.contains(new Vec2(5000, 5000))).toBe(true);

      const found = ctx.quadTree.query(new Rect(4900, 4900, 200, 200));
      expect(found).toContain(entity.id);
    });

    it('should handle incremental moves without full rebuild', () => {
      const entity = ctx.newEntity({ label: 'Mover' });
      entity.move(0, 0);

      expect(ctx.quadTree.query(new Rect(-10, -10, 20, 20))).toContain(entity.id);

      entity.move(100, 100);

      expect(ctx.quadTree.query(new Rect(-10, -10, 20, 20))).not.toContain(entity.id);
      expect(ctx.quadTree.query(new Rect(90, 90, 20, 20))).toContain(entity.id);
    });

    it('should not crash with overlapping points (recursion guard)', () => {
      for (let i = 0; i < 20; i++) {
        const e = ctx.newEntity({}, i);
        e.move(10, 10);
      }

      const found = ctx.quadTree.query(new Rect(5, 5, 10, 10));
      expect(found.length).toBe(20);
    });
  });

  describe('Atomic Patching (apply)', () => {
    it('should apply a batch of actions atomically', () => {
      ctx.apply([
        {
          type: 'CREATE_ENTITY',
          id: 100,
          inner: { label: 'Remote' },
          position: { x: 50, y: 50 },
          parentId: null
        },
        {
          type: 'CREATE_SOCKET',
          id: 200,
          entityId: 100,
          kind: SocketKind.OUTPUT,
          name: 'out',
          offset: { x: 10, y: 0 }
        }
      ]);

      const entity = ctx.entities.get(100);
      const socket = ctx.sockets.get(200);

      expect(entity).toBeDefined();
      expect(entity?.inner.label).toBe('Remote');
      expect(socket).toBeDefined();
      expect(entity?.sockets.has(200)).toBe(true);
    });

    it('should move entities via atomic patches', () => {
      const e = ctx.newEntity({});
      e.move(0, 0);

      ctx.apply({
        type: 'MOVE_ENTITY',
        id: e.id,
        from: { x: 0, y: 0 },
        to: { x: 200, y: 300 }
      });

      expect(e.position.x).toBe(200);
      expect(e.position.y).toBe(300);
    });
  });

  describe('Reactivity & Cycle Protection', () => {
    it('should prevent infinite loops in socket propagation', () => {
      const e1 = ctx.newEntity({});
      const e2 = ctx.newEntity({});

      const out1 = ctx.newSocket(e1, SocketKind.OUTPUT, 'out');
      const in1 = ctx.newSocket(e1, SocketKind.INPUT, 'in');
      const out2 = ctx.newSocket(e2, SocketKind.OUTPUT, 'out');
      const in2 = ctx.newSocket(e2, SocketKind.INPUT, 'in');

      ctx.newLink({ from: out1, to: in2 });
      ctx.newLink({ from: out2, to: in1 });

      ctx.registerSocketValueListener((s, val) => {
        if (s.id === in2.id && out2.value !== val) {
          ctx.setSocketValue(out2.id, val);
        }
        if (s.id === in1.id && out1.value !== val) {
          ctx.setSocketValue(out1.id, val);
        }
      });

      expect(() => {
        ctx.setSocketValue(out1.id, 'loop-test');
      }).not.toThrow();

      expect(in2.value).toBe('loop-test');
      expect(out2.value).toBe('loop-test');
      expect(ctx.sockets.get(in2.id)?.value).toBe('loop-test');
    });
  });

  describe('Manhattan Routing', () => {
    it('should generate a valid SVG path for step links', () => {
      const e1 = ctx.newEntity({});
      const e2 = ctx.newEntity({});
      e1.move(0, 0);
      e2.move(200, 200);

      const s1 = ctx.newSocket(e1, SocketKind.OUTPUT, 'out');
      const s2 = ctx.newSocket(e2, SocketKind.INPUT, 'in');

      const link = ctx.newLink({ from: s1, to: s2, kind: LinkKind.STEP })!;

      const path = getLinkPath(ctx, link);

      expect(path).toContain('M 0 0');
      expect(path).toContain('L 20 0');
      expect(path).toContain('L 200 200');
    });
  });
});
