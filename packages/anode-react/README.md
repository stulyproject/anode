# @stuly/anode-react

React bindings and components for Anode, providing a declarative layer over the headless core engine.

## Installation

```bash
npm install @stuly/anode-react @stuly/anode
```

## Quick Start

```tsx
import { AnodeProvider, World } from '@stuly/anode-react';

export default function App() {
  return (
    <AnodeProvider>
      <World />
    </AnodeProvider>
  );
}
```

## Key Components & Hooks

- **`World`**: Primary canvas component.
- **`AnodeProvider`**: Context provider for the engine.
- **`useAnode()`**: Access the core engine instance.
- **`useSocketValue()`**: Subscribe to reactive data flow.
- **`useVisibleNodes()`**: Optimized spatial culling for large graphs.

For detailed documentation, usage examples, and core principles, see the [Full README](https://github.com/stulyproject/anode?tab=readme-ov-file).
