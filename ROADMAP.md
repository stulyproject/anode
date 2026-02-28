# Roadmap

## Core (anode)

- [x] **Coordinate System**: Formalize world vs local coordinates (including Quad-Trees for spatial indexing and efficient rendering).
- [x] **Grouping Enhancements**: Nested groups and group-level move listeners.
- [x] **Validation**: Add link validation rules (e.g., prevent cycles).
- [x] **Undo / Redo History**: Command pattern for all graph modifications.
- [ ] **Auto-Layout**: Tree and Grid layout algorithms (Dagre-like).
- [x] **QuadTree Optimization**:
  - _Goal_: Dynamic boundaries and incremental updates.
  - _How_: Replace fixed `-100k` to `100k` bounds with a dynamic boundary that auto-grows as nodes are added or moved. Implement `remove(pos, data)` and `move(oldPos, newPos, data)` methods in the `QuadTree` class to avoid full rebuilds on every node drag.
- [x] **Atomic Patching & Synchronization**:
  - _Goal_: Apply fine-grained updates to the graph state, ideal for real-time collaboration.
  - _How_: Expose an `apply(actions: HistoryAction[])` method in the `Context` class. This allows external systems to push atomic changes (created by another user or a diffing engine) directly into the graph. This replaces monolithic merging with a stream of verifiable operations.
- [x] **Reactivity Safety**:
  - _Goal_: Prevent stack overflows and infinite loops during data propagation.
  - _How_: In `setSocketValue`, implement a `Set<number>` or a recursion depth counter to track "visited" sockets during a single propagation cycle. This prevents cycles from manual state injections or complex circular dependencies.

## React Wrapper (anode-react)

- [x] **Viewport Management**:
  - [x] Pan and Zoom (Canvas-like interaction).
  - [x] `fitView` functionality to center the graph.
- [x] **Interactivity**:
  - [x] Selection state (Nodes/Links).
  - [x] Deletion support (Backspace/Delete keys).
  - [x] Snap-to-grid while dragging.
  - [x] **Box Selection**: Drag marquee to select multiple elements.
  - [x] **Touch Support**: Pinch-to-zoom and touch dragging.
  - [x] **Group Interactivity**: Drag group background to move all children.
  - [x] **Advanced Link Interaction**:
    - _Goal_: Re-connecting links and adding path points.
    - _Why_: Improves UX for complex graphs and allows routing links around nodes.
- [x] **Components**:
  - [x] **MiniMap**: A small preview of the graph.
    - [ ] **MiniMap Interactivity**:
      - _Goal_: Click and drag on the MiniMap to pan the main viewport.
      - _Why_: Standard navigation pattern for professional node editors.
  - [x] **Controls**: Zoom in/out/reset buttons.
  - [x] **Panel**: Generic container for floating UI elements.
- [x] **API**:
  - [x] **Selection API**: Path selection and multi-select.
  - [x] **Validation Hooks**: `isValidConnection` for custom rules.
  - [x] **Full Declarative Sync**: One-way/Two-way sync between props and core context.
  - [x] Specialized Hooks: `useNodes`, `useEdges`, `useVisibleNodes`.
- [x] **Component Refactoring**:
  - _Goal_: Decompose the monolithic `World` component into smaller, focused units.
  - _How_: Break down `World.tsx` into sub-components like `ViewportManager` (pan/zoom/resize), `InteractionHandler` (selection/dragging/connection), `SyncManager` (declarative prop-to-engine sync), and `ShortcutProvider` (keyboard events).
- [x] **Testing Infrastructure**:
  - _Goal_: Robust unit and behavioral testing for React components and hooks.
  - _How_: Set up Vitest with JSDOM and React Testing Library. Added specialized mocks for `ResizeObserver` and verified core context provisioning and declarative sync.
- [x] **Aesthetics**:
  - [x] Customizable link paths (Straight, Step, SmoothStep, Bezier).
  - [x] **Custom Link Components**:
    - _Goal_: Allow custom React components along link paths (e.g., buttons, labels).
    - _Why_: Enables richer interactions and data visualization on connections.
  - [x] Transition animations for node movements.
  - [x] Dynamic Background: Scaling and panning grid/dots.
