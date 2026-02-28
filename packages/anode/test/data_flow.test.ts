import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from '../src/core/context.js';
import { SocketKind } from '../src/core/elements.js';

describe('Reactive Data Flow', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  it('should propagate values from output to input', () => {
    const nodeA = ctx.newEntity({ name: 'Source' });
    const nodeB = ctx.newEntity({ name: 'Sink' });
    const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');
    const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

    ctx.newLink({ from: outA, to: inB });

    ctx.setSocketValue(outA.id, 42);
    expect(inB.value).toBe(42);
  });

  it('should propagate values through multiple links', () => {
    const n1 = ctx.newEntity({ name: '1' });
    const n2 = ctx.newEntity({ name: '2' });
    const n3 = ctx.newEntity({ name: '3' });

    const out1 = ctx.newSocket(n1, SocketKind.OUTPUT);
    const in2 = ctx.newSocket(n2, SocketKind.INPUT);
    const out2 = ctx.newSocket(n2, SocketKind.OUTPUT);
    const in3 = ctx.newSocket(n3, SocketKind.INPUT);

    ctx.newLink({ from: out1, to: in2 });
    ctx.newLink({ from: out2, to: in3 });

    // Mock a manual pipe in node 2
    ctx.registerSocketValueListener((s, val) => {
      if (s.id === in2.id) {
        ctx.setSocketValue(out2.id, val);
      }
    });

    ctx.setSocketValue(out1.id, 'hello');
    expect(in3.value).toBe('hello');
  });
});
