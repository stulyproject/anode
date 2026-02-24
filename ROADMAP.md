# Roadmap

## Core (anode)

- [ ] **Coordinate System**: Formalize world vs local coordinates (including Quad-Trees for spatial indexing and efficient rendering).
- [ ] **Grouping Enhancements**: Nested groups and group-level move listeners.
- [ ] **Performance**: Optimize `toJSON`/`fromJSON` for large graphs.
- [ ] **Validation**: Add link validation rules (e.g., prevent cycles).

## React Wrapper (anode-react)

- [ ] **Viewport Management**:
  - [ ] Pan and Zoom (Canvas-like interaction).
  - [ ] `fitView` functionality to center the graph.
- [ ] **Interactivity**:
  - [ ] Selection state (Nodes/Links).
  - [ ] Deletion support (Backspace/Delete keys).
  - [ ] Snap-to-grid while dragging.
- [ ] **Components**:
  - [ ] **MiniMap**: A small preview of the graph.
  - [ ] **Controls**: Zoom in/out/reset buttons.
  - [ ] **Panel**: Generic container for floating UI elements.
- [ ] **API**:
  - [ ] Declarative `nodes`/`edges` props for `World` (ReactFlow style).
  - [ ] Specialized Hooks: `useNodes`, `useEdges`, `useOnConnect`.
- [ ] **Aesthetics**:
  - [ ] Customizable link paths (Straight, Step, SmoothStep).
  - [ ] Transition animations for node movements.
