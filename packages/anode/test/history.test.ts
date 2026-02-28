import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context.js';

describe('History Management', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  it('should undo and redo entity creation', () => {
    ctx.newEntity({ label: 'A' });
    expect(ctx.entities.size).toBe(1);

    ctx.undo();
    expect(ctx.entities.size).toBe(0);

    ctx.redo();
    expect(ctx.entities.size).toBe(1);
  });

  it('should undo and redo complex linking', () => {
    const n1 = ctx.newEntity({ label: '1' });
    const n2 = ctx.newEntity({ label: '2' });
    const s1 = ctx.newSocket(n1, 'OUTPUT' as any, 'out');
    const s2 = ctx.newSocket(n2, 'INPUT' as any, 'in');

    ctx.newLink({ from: s1, to: s2 });
    expect(ctx.links.size).toBe(1);

    ctx.undo();
    expect(ctx.links.size).toBe(0);

    ctx.redo();
    expect(ctx.links.size).toBe(1);
  });
});
