# Roadmap

## Core (anode)

- [x] **Coordinate System**: Formalize world vs local coordinates (including Quad-Trees for spatial indexing and efficient rendering).
- [x] **Grouping Enhancements**: Nested groups and group-level move listeners.
- [ ] **Performance**: Optimize `toJSON`/`fromJSON` for large graphs.
- [x] **Validation**: Add link validation rules (e.g., prevent cycles).
- [x] **Undo / Redo History**: Command pattern for all graph modifications.
- [ ] **Auto-Layout**: Tree and Grid layout algorithms (Dagre-like).

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
- [x] **Aesthetics**:
  - [x] Customizable link paths (Straight, Step, SmoothStep, Bezier).
  - [x] **Custom Link Components**:
    - _Goal_: Allow custom React components along link paths (e.g., buttons, labels).
    - _Why_: Enables richer interactions and data visualization on connections.
  - [x] Transition animations for node movements.
  - [x] Dynamic Background: Scaling and panning grid/dots.
