# anode-react

React bindings and components for Anode, providing a declarative layer over
the headless core engine.

## Installation

```bash
npm install @stuly/anode-react @stuly/anode
```

## Components & Hooks

- **World:** The primary canvas component for rendering the node graph.
- **Socket:** A component for rendering connection points within nodes.
- **Hooks:**
  - `useAnode()`: Access the core engine.
  - `useSocketValue()`: Subscribe to reactive data flow.
  - `useVisibleNodes()`: Optimized spatial culling.
  - `useEntitySockets()`: Reactive socket management.

For detailed documentation and usage examples, see the [root README](../../README.md).
