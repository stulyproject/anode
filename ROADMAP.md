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
  - [ ] **Box Selection**: Drag marquee to select multiple elements.
  - [ ] **Touch Support**: Pinch-to-zoom and touch dragging.
- [x] **Components**:
  - [x] **MiniMap**: A small preview of the graph.
  - [x] **Controls**: Zoom in/out/reset buttons.
  - [x] **Panel**: Generic container for floating UI elements.
- [x] **API**:
  - [x] **Selection API**: Path selection and multi-select.
  - [x] **Validation Hooks**: `isValidConnection` for custom rules.
  - [ ] **Full Declarative Sync**: One-way/Two-way sync between props and core context.
  - [x] Specialized Hooks: `useNodes`, `useEdges`, `useVisibleNodes`.
- [x] **Aesthetics**:
  - [x] Customizable link paths (Straight, Step, SmoothStep, Bezier).
  - [x] Transition animations for node movements.
  - [x] Dynamic Background: Scaling and panning grid/dots.
