<div align="center">

  <picture>
    <img alt="CodSpeed logo" src="./assets/anode.svg" width="350px">
  </picture>

</div>

<h3 align="center">Graph node library made simple</h3>

Anode is a high-performance node-graph engine built with a focus on architectural
flexibility and spatial efficiency. While it provides first-class React bindings,
the core logic is entirely headless and framework-agnostic. This separation allows
the engine to handle the complex mathematics of graph topology, coordinate systems,
and data propagation while remaining decoupled from the rendering implementation.

### Headless and Framework-Agnostic Core

The library is structured into two distinct layers. The core engine, located in
the `anode` package, manages the source of truth using a centralized `Context`.
This context tracks entities (nodes), sockets, links, and groups in a flat,
high-performance data structure. Because the core does not rely on a specific
UI framework, it can be integrated into vanilla JavaScript environments,
alternative rendering engines like PixiJS or Three.js, or used server-side for
graph validation and processing.
The `anode-react` package is an optional, declarative layer that synchronizes
this headless state with the React lifecycle.

### Spatial Efficiency with QuadTree Indexing

One of the primary challenges in building large-scale node editors is maintaining
performance as the number of elements grows. Anode addresses this by integrating
a QuadTree spatial index directly into the core layout engine. Instead of
iterating through every node for rendering or selection, the engine performs
spatial queries. This allows the UI layer to implement "spatial culling," where
only the nodes currently within the user's viewport are processed or rendered.
This optimization ensures that even graphs with thousands of nodes remain
interactive and fluid, as the rendering overhead scales with the viewport size
rather than the total graph complexity.

### Transactional Integrity and History

Managing state in a complex graph requires more than simple reactivity; it requires
transactional control. Anode's `HistoryManager` implements a command-based undo/redo
system that tracks discrete actions performed on the context. To handle operations
that involve multiple simultaneous changes—such as deleting a group and its nested
links or executing an automated layout—the engine provides a `batch` method.
By wrapping modifications in a batch, developers ensure that all changes are
treated as a single atomic transaction in the history stack, preventing
inconsistent intermediate states and providing a clean user experience for reverts.

### Reactive Data Propagation

Anode provides a built-in mechanism for value propagation between sockets, turning
the visual graph into a functional data-flow engine. Sockets are categorized as
either inputs or outputs, and links serve as the conduits for data.
When an output socket's value is updated, the engine automatically propagates that
value through all established links to the target input sockets.
This propagation is decoupled from the UI re-render cycle; the React bindings
utilize specialized hooks to subscribe to specific socket changes, ensuring that
components only update when their relevant data actually changes, further reducing
unnecessary reconciliation work.

### Quick Start Examples

#### 1. Headless Core (Framework-Agnostic)

```typescript
import { Context, SocketKind } from '@stuly/anode';

const ctx = new Context();

// Create nodes and sockets
const nodeA = ctx.newEntity({ label: 'Node A' });
const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'out');

const nodeB = ctx.newEntity({ label: 'Node B' });
const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'in');

// Connect them and move node
ctx.newLink(outA, inB);
nodeA.move(100, 100);
```

#### 2. React Integration

```tsx
import { AnodeProvider, World } from '@stuly/anode-react';

const MyNode = ({ entity }) => <div>{entity.data.label}</div>;

export default function App() {
  return (
    <AnodeProvider>
      <World nodeTypes={{ myNode: MyNode }} />
    </AnodeProvider>
  );
}
```

#### 3. Atomic Operations (History)

```typescript
// All changes inside batch() are recorded as a single undo/redo step
ctx.batch(() => {
  const node = ctx.newEntity({ label: 'Temporary Node' });
  node.move(50, 50);
}, 'Create and Move Node');

ctx.history.undo();
ctx.history.redo();
```

#### 4. Data Flow propagation

```typescript
// Sockets automatically propagate values to their links
ctx.setSocketValue(outA.id, 42);

// inB value will be 42 after propagation
console.log(ctx.sockets.get(inB.id).value);
```

### Advanced Integration Example

The following example demonstrates how the headless core and the React bindings
interact to create a functional node graph with reactive data calculation.

```tsx
import { useEffect } from 'react';
import {
  AnodeProvider,
  World,
  Socket,
  useAnode,
  useSocketValue,
  useEntitySockets
} from '@stuly/anode-react';
import { Entity, SocketKind } from '@stuly/anode';

const CalculationNode = ({ entity }: { entity: Entity }) => {
  const ctx = useAnode();
  const sockets = useEntitySockets(entity.id);

  // Reactively subscribe to input values
  const valA = useSocketValue(sockets.find((s) => s.name === 'a')?.id ?? null) ?? 0;
  const valB = useSocketValue(sockets.find((s) => s.name === 'b')?.id ?? null) ?? 0;
  const result = valA + valB;

  // Propagate the calculated result to the output socket
  useEffect(() => {
    const out = sockets.find((s) => s.name === 'result');
    if (out) ctx.setSocketValue(out.id, result);
  }, [result, sockets, ctx]);

  return (
    <div className="custom-node">
      <div>Sum: {result}</div>
      <Socket entityId={entity.id} kind={SocketKind.INPUT} name="a" />
      <Socket entityId={entity.id} kind={SocketKind.INPUT} name="b" />
      <Socket entityId={entity.id} kind={SocketKind.OUTPUT} name="result" />
    </div>
  );
};
```

### Technical Project Structure

- **anode (Core):** Contains the headless `Context`, the `QuadTree` spatial index,
  the `HistoryManager`, and the core element definitions (Entity, Link, Socket, Group).
- **anode-react (Bindings):** Provides the `World` canvas, `AnodeProvider`, and hooks
  for spatial queries (`useVisibleNodes`), socket management (`useEntitySockets`),
  and data subscription (`useSocketValue`).

### Contributing

We welcome contributions of all kinds! If you're interested in building bindings
for other frameworks (like Vue, Svelte, or Solid), or if you want to improve
the core engine, please feel free to open a PR.

- **Framework Bindings:** If you want to contribute a binding for a framework
  other than React, please follow the architecture of `anode-react` as a
  reference. Use the headless `Context` and its subscription system to stay
  in sync with the engine.
- **Bug Fixes & Features:** Check the `ROADMAP.md` for inspiration or report
  issues you've encountered.

### License

MIT
