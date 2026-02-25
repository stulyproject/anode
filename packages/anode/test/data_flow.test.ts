import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from '../src/core/context';
import { SocketKind } from '../src/core/elements';

describe('Data Flow (Value Propagation)', () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
  });

  it('should propagate value from output to input', () => {
    const nodeA = ctx.newEntity({ name: 'Source' });
    const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');

    const nodeB = ctx.newEntity({ name: 'Sink' });
    const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

    ctx.newLink(outA, inB);

    const spy = vi.fn();
    ctx.registerSocketValueListener(spy);

    // Set value on output
    ctx.setSocketValue(outA.id, 'Hello World');

    // Input should have the value
    expect(inB.value).toBe('Hello World');

    // Listener should have been called twice (one for output, one for input)
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(outA, 'Hello World');
    expect(spy).toHaveBeenCalledWith(inB, 'Hello World');
  });

  it('should propagate through multiple links', () => {
    const n1 = ctx.newEntity({ name: '1' });
    const out1 = ctx.newSocket(n1, SocketKind.OUTPUT);

    const n2 = ctx.newEntity({ name: '2' });
    const in2 = ctx.newSocket(n2, SocketKind.INPUT);
    const out2 = ctx.newSocket(n2, SocketKind.OUTPUT);

    const n3 = ctx.newEntity({ name: '3' });
    const in3 = ctx.newSocket(n3, SocketKind.INPUT);

    ctx.newLink(out1, in2);
    ctx.newLink(out2, in3);

    // Manual bridge logic: when in2 changes, n2 updates out2
    ctx.registerSocketValueListener((socket, value) => {
      if (socket.id === in2.id) {
        ctx.setSocketValue(out2.id, (value as number) * 2);
      }
    });

    ctx.setSocketValue(out1.id, 10);

    expect(in2.value).toBe(10);
    expect(out2.value).toBe(20);
    expect(in3.value).toBe(20);
  });
});
