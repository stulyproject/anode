# @stuly/anode-react

## 0.1.0

### Minor Changes

- be44381: We are excited to announce the first release of Anode, a high-performance node-graph engine built for architectural
  flexibility and massive scale.

  Anode is split into two packages:
  - `anode`: A headless, framework-agnostic core that manages graph topology and spatial indexing.
  - `anode-react`: First-class React bindings for building interactive, declarative node editors.

  Key Features
  - Spatial Efficiency: Integrated indexing for fluid performance with thousands
    of nodes via spatial culling.
  - Transactional Integrity: Command-based undo/redo system with atomic batch operations.
  - Reactive Data Flow: Built-in value propagation between sockets, decoupled from the UI render cycle.
  - Nested Topology: Robust support for nested groups and relative coordinate systems.

  Getting Started
  Check out our README.md (https://github.com/stulyproject/anode) for quick-start examples.

### Patch Changes

- Updated dependencies [be44381]
  - @stuly/anode@0.1.0
