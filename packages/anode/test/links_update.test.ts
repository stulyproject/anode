import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from '../src/core/context.js';

describe('Link Update Events', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  it('should trigger update listener when a node in a group moves', () => {
    const node = ctx.newEntity({});
    const group = ctx.newGroup();
    ctx.addToGroup(group.id, node.id);

    const onUpdate = vi.fn();
    ctx.registerEntityMoveListener(onUpdate);

    group.position.set(100, 100);
    ctx.moveGroup(group, 10, 10);

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should trigger update listener when a group in a group moves', () => {
    const node = ctx.newEntity({});
    const childGroup = ctx.newGroup();
    const parentGroup = ctx.newGroup();

    ctx.addToGroup(childGroup.id, node.id);
    ctx.addGroupToGroup(parentGroup.id, childGroup.id);

    const onUpdate = vi.fn();
    ctx.registerEntityMoveListener(onUpdate);

    ctx.moveGroup(parentGroup, 50, 50);

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should notify socket move listeners when parent entity moves', () => {
    const node = ctx.newEntity({});
    const socket = ctx.newSocket(node, 'OUTPUT' as any);
    const onSocketMove = vi.fn();

    ctx.registerEntityMoveListener(() => {
      ctx.notifySocketMove(socket);
    });

    ctx.registerSocketMoveListener(onSocketMove);

    node.move(100, 100);
    expect(onSocketMove).toHaveBeenCalled();
  });
});
