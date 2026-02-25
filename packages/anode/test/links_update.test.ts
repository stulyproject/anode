import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from '../src/core/context';

describe('Link Update Core Logic', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  it('should trigger move callbacks for entities when moved directly', () => {
    const node = ctx.newEntity({});
    const spy = vi.fn();
    ctx.registerEntityMoveListener(spy);

    node.move(100, 100);
    expect(spy).toHaveBeenCalledWith(node, expect.objectContaining({ x: 100, y: 100 }));
  });

  it('should trigger move callbacks for nested entities when parent group moves', () => {
    const node = ctx.newEntity({});
    const group = ctx.newGroup();
    ctx.addToGroup(group.id, node.id);

    const spy = vi.fn();
    ctx.registerEntityMoveListener(spy);

    // Initial world pos is 0,0
    ctx.moveGroup(group, 50, 50);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(node, expect.objectContaining({ x: 50, y: 50 }));
  });

  it('should trigger move callbacks for deep nested entities', () => {
    const node = ctx.newEntity({});
    const childGroup = ctx.newGroup();
    const parentGroup = ctx.newGroup();

    ctx.addToGroup(childGroup.id, node.id);
    ctx.addGroupToGroup(parentGroup.id, childGroup.id);

    const spy = vi.fn();
    ctx.registerEntityMoveListener(spy);

    ctx.moveGroup(parentGroup, 100, 100);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(node, expect.objectContaining({ x: 100, y: 100 }));
  });
});
