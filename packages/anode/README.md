# anode

The core headless engine for Anode. It manages graph state, connectivity,
spatial indexing, and history independently of any UI framework.

## Installation

```bash
npm install anode
```

## Features

- **Headless Context:** Centralized state management for nodes, links, and sockets.
- **QuadTree Indexing:** High-performance spatial querying and culling.
- **Transactional History:** Built-in undo/redo with support for batched actions.
- **Data Flow:** Automated value propagation between linked sockets.

For detailed documentation and usage examples, see the [root README](../../README.md).
