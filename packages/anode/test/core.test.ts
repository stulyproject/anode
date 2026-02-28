import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context.js';
import { SocketKind } from '../src/core/elements.js';

describe('Anode Core', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  describe('Entities', () => {
    it('should create a new entity', () => {
      const node = ctx.newEntity({ label: 'Test' });
      expect(ctx.entities.size).toBe(1);
      expect(node.inner.label).toBe('Test');
    });

    it('should drop an entity and its associated sockets', () => {
      const node = ctx.newEntity({});
      ctx.newSocket(node, SocketKind.OUTPUT, 'out');
      expect(ctx.sockets.size).toBe(1);

      ctx.dropEntity(node);
      expect(ctx.entities.size).toBe(0);
      expect(ctx.sockets.size).toBe(0);
    });
  });

  describe('Links', () => {
    it('should create a valid link', () => {
      const nodeA = ctx.newEntity({ label: 'A' });
      const nodeB = ctx.newEntity({ label: 'B' });
      const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
      const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

      const link = ctx.newLink({ from: outA, to: inB });
      expect(ctx.links.size).toBe(1);
      expect(link?.from).toBe(outA.id);
      expect(link?.to).toBe(inB.id);
    });

    it('should prevent connecting same socket types', () => {
      const nodeA = ctx.newEntity({ label: 'Node A' });
      const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
      const inA = ctx.newSocket(nodeA, SocketKind.INPUT, 'in');

      // Same entity link prevention
      expect(ctx.newLink({ from: outA, to: inA })).toBeNull();
    });

    it('should detect cycles', () => {
      const nodeA = ctx.newEntity({ label: 'A' });
      const nodeB = ctx.newEntity({ label: 'B' });
      const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
      const inA = ctx.newSocket(nodeA, SocketKind.INPUT, 'in');
      const outB = ctx.newSocket(nodeB, SocketKind.OUTPUT, 'out');
      const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

      ctx.newLink({ from: outA, to: inB });
      const linkBA = ctx.newLink({ from: outB, to: inA });

      expect(linkBA).toBeNull();
    });
  });

  describe('Groups', () => {
    it('should handle nested groups', () => {
      const groupChild = ctx.newGroup('Child');
      const groupParent = ctx.newGroup('Parent');

      ctx.addGroupToGroup(groupParent.id, groupChild.id);
      expect(groupChild.parentId).toBe(groupParent.id);
      expect(groupParent.groups.has(groupChild.id)).toBe(true);
    });

    it('should update entity world position when group moves', () => {
      const group = ctx.newGroup('G');
      const node = ctx.newEntity({ label: 'Node' });
      ctx.addToGroup(group.id, node.id);

      node.move(10, 10);
      group.position.set(50, 50);

      const worldPos = ctx.getWorldPosition(node.id);
      expect(worldPos.x).toBe(60);
      expect(worldPos.y).toBe(60);
    });
  });
});
