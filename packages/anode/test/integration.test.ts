import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context.js';
import { SocketKind } from '../src/core/elements.js';

describe('Integration Scenarios', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  it('should handle full lifecycle: create -> group -> link -> drop', () => {
    const nodeA = ctx.newEntity({ label: 'A' });
    const nodeB = ctx.newEntity({ label: 'B' });
    const group = ctx.newGroup();

    ctx.addToGroup(group.id, nodeA.id);
    ctx.addToGroup(group.id, nodeB.id);

    const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
    const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

    ctx.newLink({ from: outA, to: inB });

    expect(ctx.entities.size).toBe(2);
    expect(ctx.links.size).toBe(1);
    expect(ctx.groups.size).toBe(1);

    ctx.dropGroup(group);
    // Group drop should detach children but not delete them
    expect(ctx.entities.size).toBe(2);
    expect(nodeA.parentId).toBeNull();

    ctx.dropEntity(nodeA);
    expect(ctx.entities.size).toBe(1);
    expect(ctx.links.size).toBe(0);
  });

  it('should handle complex nested group structures', () => {
    const node = ctx.newEntity({});
    const groupChild = ctx.newGroup();
    const groupParent = ctx.newGroup();

    ctx.addToGroup(groupChild.id, node.id);
    ctx.addGroupToGroup(groupParent.id, groupChild.id);

    expect(ctx.getWorldPosition(node.id)).toBeDefined();
    expect(node.parentId).toBe(groupChild.id);
    expect(groupChild.parentId).toBe(groupParent.id);
  });

  it('should preserve state through serialization', () => {
    const nodeA = ctx.newEntity({});
    const nodeB = ctx.newEntity({});
    const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
    const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');
    ctx.newLink({ from: outA, to: inB });

    const json = ctx.toJSON();
    const ctx2 = new Context();
    ctx2.fromJSON(json);

    expect(ctx2.entities.size).toBe(2);
    expect(ctx2.links.size).toBe(1);
  });
});
