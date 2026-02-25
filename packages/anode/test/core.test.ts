import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context';
import { SocketKind } from '../src/core/elements';
import { Rect } from '../src/core/layout';

describe('Anode Core', () => {
  let ctx: Context<{ label: string }>;

  beforeEach(() => {
    ctx = new Context();
  });

  describe('Basic Operations', () => {
    it('should create entities and sockets', () => {
      const node = ctx.newEntity({ label: 'Test' });
      const socket = ctx.newSocket(node, SocketKind.OUTPUT, 'out');

      expect(ctx.entities.size).toBe(1);
      expect(node.sockets.size).toBe(1);
      expect(ctx.sockets.has(socket.id)).toBe(true);
    });

    it('should link sockets', () => {
      const nodeA = ctx.newEntity({ label: 'A' });
      const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
      const nodeB = ctx.newEntity({ label: 'B' });
      const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

      const link = ctx.newLink(outA, inB);
      expect(link).not.toBeNull();
      expect(ctx.links.size).toBe(1);
    });
  });

  describe('Coordinate System & Nested Groups', () => {
    it('should calculate world positions correctly in nested groups', () => {
      const nodeA = ctx.newEntity({ label: 'Node A' });
      const groupChild = ctx.newGroup('Child');
      const groupParent = ctx.newGroup('Parent');

      ctx.addToGroup(groupChild.id, nodeA.id);
      ctx.addGroupToGroup(groupParent.id, groupChild.id);

      // Move parent
      ctx.moveGroup(groupParent, 100, 50);
      expect(ctx.getWorldPosition(nodeA.id)).toMatchObject({ x: 100, y: 50 });

      // Move child relative to parent
      ctx.moveGroup(groupChild, 10, 20);
      expect(ctx.getWorldPosition(nodeA.id)).toMatchObject({ x: 110, y: 70 });
    });

    it('should query entities via QuadTree', () => {
      const node = ctx.newEntity({ label: 'Node' });
      node.move(50, 50);

      const found = ctx.quadTree.query(new Rect(40, 40, 20, 20));
      expect(found).toContain(node.id);

      const notFound = ctx.quadTree.query(new Rect(0, 0, 10, 10));
      expect(notFound).not.toContain(node.id);
    });
  });

  describe('Validation', () => {
    it('should prevent cycles', () => {
      const nodeA = ctx.newEntity({ label: 'A' });
      const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
      const inA = ctx.newSocket(nodeA, SocketKind.INPUT, 'in');

      const nodeB = ctx.newEntity({ label: 'B' });
      const outB = ctx.newSocket(nodeB, SocketKind.OUTPUT, 'out');
      const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

      // A -> B
      ctx.newLink(outA, inB);

      // B -> A (Cycle)
      const linkBA = ctx.newLink(outB, inA);
      expect(linkBA).toBeNull();
      expect(ctx.links.size).toBe(1);
    });
  });

  describe('Serialization', () => {
    it('should preserve nested structures through JSON', () => {
      const nodeA = ctx.newEntity({ label: 'A' });
      const group = ctx.newGroup('G');
      ctx.addToGroup(group.id, nodeA.id);
      group.position.set(10, 10);

      const data = ctx.toJSON();
      const newCtx = new Context();
      newCtx.fromJSON(data);

      expect(newCtx.entities.size).toBe(1);
      expect(newCtx.groups.size).toBe(1);
      expect(newCtx.getWorldPosition(nodeA.id)).toMatchObject({ x: 10, y: 10 });
    });
  });
});
