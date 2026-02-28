---
"@stuly/anode-react": minor
"@stuly/anode": minor
---

Consistency and performance: A cleaner engine with refined link routing.

### Core Engine (@stuly/anode)

- Atomic Patching System: Introduced `ctx.apply(actions)`
- Dynamic QuadTree: The spatial index now auto-expands.
- Reactivity Cycle Protection: Added automated safeguards to `setSocketValue`
  to prevent infinite loops and stack overflows in circular node topologies.

- Ergonomic API: `ctx.newLink` now uses a single configuration object.

### Visuals and Routing

- New `LinkStyling` property supporting `SOLID`, `DASHED`, and `DOTTED` paths
  and `selectionColor`.
- Flow Animations: Added a flowing property to indicate data movement
  visually with customizable speed.

```ts
ctx.newLink({from, to, styling: {
  color: "#181818",
  flowing: true,
  style: LinkStyle.DASHED,
}});
```


### React Bindings (@stuly/anode-react)

- Architecture: Decomposed the monolithic World component into focused hooks
  (`useSyncManager`, `useInteractionHandler`, `useViewportManager`).
- Stable Reference Context: `AnodeProvider` now hosts a stable `worldRef`


### misc

- Strict Type Safety: Full compliance with `exactOptionalPropertyTypes` and
`noUnusedLocals`.

