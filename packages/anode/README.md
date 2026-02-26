# @stuly/anode

The high-performance, headless core engine for Anode. It manages graph topology, spatial indexing, transactional history, and reactive data flow independently of any UI framework.

## Installation

```bash
npm install @stuly/anode
```

## Quick Start

```typescript
import { Context, SocketKind } from '@stuly/anode';

const ctx = new Context();

const nodeA = ctx.newEntity({ label: 'Source' });
const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');

const nodeB = ctx.newEntity({ label: 'Sink' });
const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

ctx.newLink(outA, inB);
ctx.setSocketValue(outA.id, 'Data');
```

## Core Elements

- **`Context`**: Central state manager.
- **`Entity`**: Graph node with `inner` data.
- **`Socket`**: Reactive connection point (`INPUT`/`OUTPUT`).
- **`Link`**: Connection between sockets.
- **`Group`**: Hierarchical container.

For comprehensive documentation on architecture, spatial indexing, and history management, see the [Full README](https://github.com/stulyproject/anode?tab=readme-ov-file).
