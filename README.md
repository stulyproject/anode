# Anode

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

### Implementation Overview

The following example demonstrates how the headless core and the React bindings
interact to create a functional node graph.

```tsx
import { useEffect } from 'react';
import {
  AnodeProvider,
  World,
  Socket,
  useAnode,
  useSocketValue,
  useEntitySockets
} from 'anode-react';
import { Entity, SocketKind } from 'anode';

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

export default function App() {
  return (
    <AnodeProvider>
      {/* The World component manages the semi-infinite canvas and coordinate systems */}
      <World nodeTypes={{ calc: CalculationNode }}></World>
    </AnodeProvider>
  );
}
```

### Technical Project Structure

- **anode (Core):** Contains the headless `Context`, the `QuadTree` spatial index,
  the `HistoryManager`, and the core element definitions (Entity, Link, Socket, Group).
- **anode-react (Bindings):** Provides the `World` canvas, `AnodeProvider`, and hooks
  for spatial queries (`useVisibleNodes`), socket management (`useEntitySockets`),
  and data subscription (`useSocketValue`).

### License

MIT
