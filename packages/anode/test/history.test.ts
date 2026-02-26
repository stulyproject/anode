import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context';

describe('History (Undo/Redo)', () => {
  let ctx: Context<{ label: string }>;

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
    expect(ctx.entities.values().next().value!.inner.label).toBe('A');
  });

  it('should undo and redo entity deletion with links', () => {
    const n1 = ctx.newEntity({ label: '1' });
    const s1 = ctx.newSocket(n1, 'OUTPUT' as any, 'out');
    const n2 = ctx.newEntity({ label: '2' });
    const s2 = ctx.newSocket(n2, 'INPUT' as any, 'in');

    ctx.newLink(s1, s2);
    expect(ctx.links.size).toBe(1);

    // Drop n1 (should destroy link too)
    ctx.dropEntity(n1);
    expect(ctx.entities.size).toBe(1);
    expect(ctx.links.size).toBe(0);

    // Undo drop
    ctx.undo();
    expect(ctx.entities.size).toBe(2);
    expect(ctx.links.size).toBe(1);

    // Redo drop
    ctx.redo();
    expect(ctx.entities.size).toBe(1);
    expect(ctx.links.size).toBe(0);
  });
});
