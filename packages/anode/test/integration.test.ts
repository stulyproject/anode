import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from '../src/core/context';
import { SocketKind } from '../src/core/elements';

describe('Anode Integration', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  describe('Cascade Delete', () => {
    it('should remove links and sockets when an entity is dropped', () => {
      const nodeA = ctx.newEntity({ label: 'A' });
      const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');

      const nodeB = ctx.newEntity({ label: 'B' });
      const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

      ctx.newLink(outA, inB);

      expect(ctx.entities.size).toBe(2);
      expect(ctx.sockets.size).toBe(2);
      expect(ctx.links.size).toBe(1);

      // Drop Node A
      ctx.dropEntity(nodeA);

      expect(ctx.entities.has(nodeA.id)).toBe(false);
      expect(ctx.sockets.has(outA.id)).toBe(false);
      expect(ctx.links.size).toBe(0); // Link should be gone
      expect(ctx.entities.get(nodeB.id)?.sockets.size).toBe(1); // Node B still has its socket
    });

    it('should remove nested references when groups are manipulated', () => {
      const node = ctx.newEntity({});
      const group = ctx.newGroup();

      ctx.addToGroup(group.id, node.id);
      expect(node.parentId).toBe(group.id);
      expect(group.entities.has(node.id)).toBe(true);

      ctx.dropEntity(node);
      expect(group.entities.has(node.id)).toBe(false);
    });
  });

  describe('Event Propagation', () => {
    it('should trigger move listeners for all nested entities when a parent group moves', () => {
      const nodeA = ctx.newEntity({});
      const nodeB = ctx.newEntity({});
      const groupChild = ctx.newGroup();
      const groupParent = ctx.newGroup();

      ctx.addToGroup(groupChild.id, nodeA.id);
      ctx.addGroupToGroup(groupParent.id, groupChild.id);
      ctx.addToGroup(groupParent.id, nodeB.id);

      const moveSpy = vi.fn();
      ctx.registerEntityMoveListener(moveSpy);

      // Move parent
      ctx.moveGroup(groupParent, 50, 50);

      // Should be called for nodeA and nodeB
      expect(moveSpy).toHaveBeenCalledTimes(2);

      const calls = moveSpy.mock.calls;
      const movedIds = calls.map((c) => c[0].id);
      expect(movedIds).toContain(nodeA.id);
      expect(movedIds).toContain(nodeB.id);

      // Check absolute positions in the callback
      expect(calls.find((c) => c[0].id === nodeA.id)[1]).toMatchObject({ x: 50, y: 50 });
    });
  });
});
