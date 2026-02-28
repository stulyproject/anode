import {
  Entity,
  Link,
  LinkKind,
  Socket,
  SocketKind,
  Vec2,
  Group,
  type LinkStyling
} from './elements';
import { QuadTree, Rect } from './layout';
import { HistoryManager, type HistoryAction } from './history';

/** Callback triggered when an entity is created or dropped */
export type EntityCallback<T> = (entity: Entity<T>) => void;

/** Callback triggered when a link is created, dropped, or updated */
export type LinkCallback = (link: Link) => void;

/** Callback triggered when a socket is created, dropped, or moved */
export type SocketCallback = (socket: Socket) => void;

/** Callback triggered when an entity moves, providing its new world position */
export type EntityMoveCallback<T> = (entity: Entity<T>, pos: Vec2) => void;

/** Callback triggered when a group is created or dropped */
export type GroupCallback = (group: Group) => void;

/** Callback triggered when a socket value is updated */
export type SocketValueCallback = (socket: Socket, value: any) => void;

/** A unique handle used to unregister a listener */
export type CallbackHandle = number;

/**
 * The central engine for Anode.
 *
 * Context manages the lifecycle of entities, sockets, links, and groups.
 * It handles reactive data propagation, spatial indexing (QuadTree),
 * and transactional history (undo/redo).
 *
 * @template T The type of the custom data associated with entities.
 */
export class Context<T = any> {
  private eid: number = 0;
  private lid: number = 0;
  private sid: number = 0;
  private gid: number = 0;

  private freeEids: number[] = [];
  private freeLids: number[] = [];
  private freeSids: number[] = [];
  private freeGids: number[] = [];

  private callbackIds: number = 0;
  private freeCallbackIds: number[] = [];

  private entityCreateCallbacks: Map<number, EntityCallback<T>> = new Map();
  private entityDropCallbacks: Map<number, EntityCallback<T>> = new Map();
  private entityMoveCallbacks: Map<number, EntityMoveCallback<T>> = new Map();
  private socketMoveCallbacks: Map<number, SocketCallback> = new Map();
  private socketValueCallbacks: Map<number, SocketValueCallback> = new Map();

  private linkCreateCallbacks: Map<number, LinkCallback> = new Map();
  private linkDropCallbacks: Map<number, LinkCallback> = new Map();
  private linkUpdateCallbacks: Map<number, LinkCallback> = new Map();

  private socketCreateCallbacks: Map<number, SocketCallback> = new Map();
  private socketDropCallbacks: Map<number, SocketCallback> = new Map();

  private groupCreateCallbacks: Map<number, GroupCallback> = new Map();
  private groupDropCallbacks: Map<number, GroupCallback> = new Map();
  private bulkChangeCallbacks: Map<number, () => void> = new Map();

  /** Map of all entities indexed by their unique ID */
  entities: Map<number, Entity<T>> = new Map();

  /** Map of all links indexed by their unique ID */
  links: Map<number, Link> = new Map();

  /** Map of all sockets indexed by their unique ID */
  sockets: Map<number, Socket> = new Map();

  /** Map of all groups indexed by their unique ID */
  groups: Map<number, Group> = new Map();

  /** Spatial index for efficient querying and culling. Auto-grows boundaries. */
  quadTree: QuadTree<number> = new QuadTree(new Rect(-1000, -1000, 2000, 2000));

  /** Manager for undo/redo history */
  history: HistoryManager = new HistoryManager();

  private isApplyingHistory: boolean = false;
  private currentBatch: HistoryAction[] | null = null;
  private isBatchingQuadTree: boolean = false;

  private getNextEid() {
    return this.freeEids.pop() ?? this.eid++;
  }
  private getNextLid() {
    return this.freeLids.pop() ?? this.lid++;
  }
  private getNextSid() {
    return this.freeSids.pop() ?? this.sid++;
  }
  private getNextGid() {
    return this.freeGids.pop() ?? this.gid++;
  }
  private getNextCallbackHandle(): CallbackHandle {
    return this.freeCallbackIds.pop() ?? this.callbackIds++;
  }

  private setupEntity(entity: Entity<T>) {
    let lastPos = this.getWorldPosition(entity.id);
    entity.onMove((_pos) => {
      const newPos = this.getWorldPosition(entity.id);
      if (!this.isBatchingQuadTree) {
        this.quadTree.move(lastPos, newPos, entity.id);
        for (const socket of entity.sockets.values()) {
          this.quadTree.move(
            new Vec2(lastPos.x + socket.offset.x, lastPos.y + socket.offset.y),
            new Vec2(newPos.x + socket.offset.x, newPos.y + socket.offset.y),
            entity.id
          );
        }
      }
      lastPos = newPos;

      for (const cb of this.entityMoveCallbacks.values()) {
        try {
          cb(entity, newPos);
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  /**
   * Triggers all bulk change listeners.
   *
   * **Side Effects:**
   * 1. Invokes all functions registered via `registerBulkChangeListener`.
   * Usually called after undo/redo or batch operations to sync UI state.
   */
  notifyBulkChange() {
    for (const cb of this.bulkChangeCallbacks.values()) {
      try {
        cb();
      } catch (err) {
        console.error(err);
      }
    }
  }

  /**
   * Registers a callback that is triggered when multiple changes occur at once.
   * Useful for syncing UI state that doesn't need to respond to every individual mutation.
   *
   * @param cb The function to execute on bulk changes.
   * @returns A unique handle to unregister the listener.
   */
  registerBulkChangeListener(cb: () => void): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.bulkChangeCallbacks.set(handle, cb);
    return handle;
  }

  /**
   * Sets the value of a specific socket and triggers reactive propagation.
   *
   * **Behaviors:**
   * 1. **Propagation:** If the socket is an `OUTPUT`, pushes the value to all linked `INPUT` sockets recursively.
   * 2. **Cycle Protection:** Uses a `visited` set to prevent infinite loops and stack overflows.
   *
   * **Side Effects:**
   * 1. Updates the `socket.value`.
   * 2. Triggers `SocketValueListener` for each affected socket.
   *
   * @param socketId The unique ID of the socket.
   * @param value The new value to assign.
   * @param visited Internal set used for cycle detection during recursion.
   */
  setSocketValue(socketId: number, value: any, visited: Set<number> = new Set()) {
    if (visited.has(socketId)) return;
    visited.add(socketId);

    const socket = this.sockets.get(socketId);
    if (!socket) return;

    socket.value = value;

    for (const cb of this.socketValueCallbacks.values()) {
      cb(socket, value);
    }

    if (socket.kind === SocketKind.OUTPUT) {
      for (const link of this.links.values()) {
        if (link.from === socketId) {
          this.setSocketValue(link.to, value, visited);
        }
      }
    }
  }

  /**
   * Registers a listener for socket value changes.
   *
   * @param cb Callback receiving the updated socket and its new value.
   * @returns A unique handle to unregister the listener.
   */
  registerSocketValueListener(cb: SocketValueCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketValueCallbacks.set(handle, cb);
    return handle;
  }

  /**
   * Records a custom set of actions to the history stack.
   * Internally used by all mutation methods to support undo/redo.
   *
   * @param doActions Actions to execute for "doing" this command.
   * @param undoActions Actions to execute for "undoing" this command.
   * @param label A human-readable label for the history entry.
   */
  record(
    doActions: HistoryAction | HistoryAction[],
    undoActions: HistoryAction | HistoryAction[],
    label?: string
  ) {
    if (this.isApplyingHistory) return;
    if (this.currentBatch) return;

    const das = Array.isArray(doActions) ? doActions : [doActions];
    const uas = Array.isArray(undoActions) ? undoActions : [undoActions];

    this.history.push({
      do: das,
      undo: uas,
      label: label ?? 'Action',
      timestamp: Date.now()
    });
  }

  /**
   * Executes a function as a single atomic transaction in the history stack.
   *
   * **Behaviors:**
   * 1. **Transactionality:** Individual operations do not record separate history entries.
   * 2. **QuadTree Suspension:** Spatial index updates are suspended until the end of the batch.
   * 3. **Snapshotting:** A single state-based history entry is created for the entire operation.
   *
   * @param fn The function containing multiple mutations.
   * @param label A human-readable label for the history entry (e.g., "Layout Graph").
   */
  batch(fn: () => void, label?: string) {
    if (this.currentBatch) {
      fn();
      return;
    }

    const oldApplying = this.isApplyingHistory;
    const oldBatchingQT = this.isBatchingQuadTree;
    const beforeState = this.toJSON();

    try {
      this.isApplyingHistory = true;
      this.isBatchingQuadTree = true;
      fn();

      this.isBatchingQuadTree = oldBatchingQT;
      this.updateQuadTree();

      const afterState = this.toJSON();

      this.history.push({
        do: [{ type: 'FROM_JSON', data: afterState }],
        undo: [{ type: 'FROM_JSON', data: beforeState }],
        label: label ?? 'Batch Action',
        timestamp: Date.now()
      });
    } finally {
      this.isApplyingHistory = oldApplying;
      this.isBatchingQuadTree = oldBatchingQT;
    }
  }

  /** Reverts the last recorded transaction. */
  undo() {
    const cmd = this.history.undoStack.pop();
    if (!cmd) return;
    this.apply(cmd.undo);
    this.history.redoStack.push(cmd);
  }

  /** Re-applies the last undone transaction. */
  redo() {
    const cmd = this.history.redoStack.pop();
    if (!cmd) return;
    this.apply(cmd.do);
    this.history.undoStack.push(cmd);
  }

  /**
   * Applies one or more atomic actions to the graph state.
   * This is the primary entry point for real-time synchronization and history navigation.
   *
   * **Side Effects:**
   * 1. Updates internal maps (`entities`, `links`, etc.).
   * 2. Rebuilds/Updates QuadTree.
   * 3. Triggers bulk change listeners.
   *
   * @param actions A single action or an array of actions to apply.
   */
  apply(actions: HistoryAction | HistoryAction[]) {
    const acts = Array.isArray(actions) ? actions : [actions];
    const oldApplying = this.isApplyingHistory;
    const oldBatchingQT = this.isBatchingQuadTree;

    this.isApplyingHistory = true;
    this.isBatchingQuadTree = true;

    try {
      for (const action of acts) {
        this.applyAction(action);
      }
      this.isBatchingQuadTree = oldBatchingQT;
      this.updateQuadTree();
      this.notifyBulkChange();
    } finally {
      this.isApplyingHistory = oldApplying;
      this.isBatchingQuadTree = oldBatchingQT;
    }
  }

  private applyAction(action: HistoryAction) {
    switch (action.type) {
      case 'FROM_JSON': {
        this.fromJSON(action.data);
        break;
      }
      case 'MOVE_ENTITY': {
        const entity = this.entities.get(action.id);
        if (entity) {
          entity.position.set(action.to.x, action.to.y);
        }
        break;
      }
      case 'MOVE_GROUP': {
        const group = this.groups.get(action.id);
        if (group) {
          const dx = action.to.x - action.from.x;
          const dy = action.to.y - action.from.y;
          this.moveGroup(group, dx, dy);
        }
        break;
      }
      case 'CREATE_ENTITY': {
        const entity = new Entity(action.id, action.inner);
        entity.position.set(action.position.x, action.position.y);
        this.entities.set(entity.id, entity);
        this.eid = Math.max(this.eid, entity.id + 1);

        this.setupEntity(entity);

        if (action.parentId !== null) {
          this.addToGroup(action.parentId, entity.id);
        }
        for (const cb of this.entityCreateCallbacks.values()) cb(entity);
        break;
      }
      case 'DROP_ENTITY': {
        const entity = this.entities.get(action.id);
        if (entity) {
          this.dropEntity(entity);
        }
        break;
      }
      case 'CREATE_LINK': {
        const from = this.sockets.get(action.from);
        const to = this.sockets.get(action.to);
        if (from && to) {
          const link = new Link(action.id, from.id, to.id, action.kind, action.inner);
          if (action.styling) link.styling = { ...action.styling };
          this.links.set(link.id, link);
          this.lid = Math.max(this.lid, link.id + 1);
          for (const cb of this.linkCreateCallbacks.values()) cb(link);
        }
        break;
      }
      case 'DROP_LINK': {
        const link = this.links.get(action.id);
        if (link) {
          this.dropLink(link);
        }
        break;
      }
      case 'UPDATE_LINK': {
        const link = this.links.get(action.id);
        if (link) {
          link.from = action.from.new;
          link.to = action.to.new;
          if (action.waypoints) {
            link.waypoints = action.waypoints.new.map((p) => new Vec2(p.x, p.y));
          }
          for (const cb of this.linkUpdateCallbacks.values()) cb(link);
        }
        break;
      }
      case 'UPDATE_LINK_STYLING': {
        const link = this.links.get(action.id);
        if (link) {
          link.styling = { ...action.to };
          for (const cb of this.linkUpdateCallbacks.values()) cb(link);
        }
        break;
      }
      case 'ADD_TO_GROUP': {
        this.addToGroup(action.groupId, action.entityId);
        break;
      }
      case 'REMOVE_FROM_GROUP': {
        this.removeFromGroup(action.groupId, action.entityId);
        break;
      }
      case 'CREATE_SOCKET': {
        const entity = this.entities.get(action.entityId);
        if (entity) {
          const socket = new Socket(action.id, entity.id, action.kind, action.name);
          socket.offset.set(action.offset.x, action.offset.y);
          this.sockets.set(socket.id, socket);
          entity.sockets.set(socket.id, socket);
          this.sid = Math.max(this.sid, socket.id + 1);
          for (const cb of this.socketCreateCallbacks.values()) cb(socket);
        }
        break;
      }
      case 'DROP_SOCKET': {
        const socket = this.sockets.get(action.id);
        if (socket) {
          this.dropSocket(socket);
        }
        break;
      }
    }
  }

  /** Registers a listener for entity creation. */
  registerEntityCreateListener(cb: EntityCallback<T>): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.entityCreateCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for entity deletion. */
  registerEntityDropListener(cb: EntityCallback<T>): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.entityDropCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for entity movements (absolute position). */
  registerEntityMoveListener(cb: EntityMoveCallback<T>): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.entityMoveCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for socket movements (relative offset changes). */
  registerSocketMoveListener(cb: SocketCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketMoveCallbacks.set(handle, cb);
    return handle;
  }

  /** Triggers all socket move listeners. */
  notifySocketMove(socket: Socket) {
    for (const cb of this.socketMoveCallbacks.values()) {
      try {
        cb(socket);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /** Registers a listener for link creation. */
  registerLinkCreateListener(cb: LinkCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.linkCreateCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for link deletion. */
  registerLinkDropListener(cb: LinkCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.linkDropCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for link updates (reconnections, waypoints). */
  registerLinkUpdateListener(cb: LinkCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.linkUpdateCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for socket creation. */
  registerSocketCreateListener(cb: SocketCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketCreateCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for socket deletion. */
  registerSocketDropListener(cb: SocketCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketDropCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for group creation. */
  registerGroupCreateListener(cb: GroupCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.groupCreateCallbacks.set(handle, cb);
    return handle;
  }

  /** Registers a listener for group deletion. */
  registerGroupDropListener(cb: GroupCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.groupDropCallbacks.set(handle, cb);
    return handle;
  }

  /**
   * Unregisters a listener using the handle returned by the registration method.
   * @returns true if the listener was successfully removed.
   */
  unregisterListener(handle: CallbackHandle) {
    const deleted =
      this.linkCreateCallbacks.delete(handle) ||
      this.linkDropCallbacks.delete(handle) ||
      this.linkUpdateCallbacks.delete(handle) ||
      this.entityCreateCallbacks.delete(handle) ||
      this.entityDropCallbacks.delete(handle) ||
      this.entityMoveCallbacks.delete(handle) ||
      this.socketCreateCallbacks.delete(handle) ||
      this.socketDropCallbacks.delete(handle) ||
      this.socketMoveCallbacks.delete(handle) ||
      this.groupCreateCallbacks.delete(handle) ||
      this.groupDropCallbacks.delete(handle) ||
      this.bulkChangeCallbacks.delete(handle);

    if (deleted) {
      this.freeCallbackIds.push(handle);
      return true;
    }
    return false;
  }

  /**
   * Creates and returns a new group.
   *
   * **Side Effects:**
   * 1. Adds group to `groups` map.
   * 2. Triggers `GroupCreateListener`.
   *
   * @param name Human-readable name for the group.
   * @param id Optional forced ID.
   */
  newGroup(name: string = '', id?: number) {
    const gid = id ?? this.getNextGid();
    const group = new Group(gid, name);
    this.groups.set(group.id, group);
    if (id !== undefined) {
      this.gid = Math.max(this.gid, id + 1);
    }
    for (const cb of this.groupCreateCallbacks.values()) {
      try {
        cb(group);
      } catch (err) {
        console.error(err);
      }
    }
    return group;
  }

  /**
   * Drops a group.
   *
   * **Side Effects:**
   * 1. Detaches all child entities and groups (they remain in the context).
   * 2. Removes the group from its parent group if applicable.
   * 3. Triggers `GroupDropListener`.
   */
  dropGroup(group: Group) {
    if (this.groups.delete(group.id)) {
      if (group.parentId !== null) {
        this.removeGroupFromGroup(group.parentId, group.id);
      }
      for (const eid of group.entities) {
        const entity = this.entities.get(eid);
        if (entity) entity.parentId = null;
      }
      for (const gid of group.groups) {
        const childGroup = this.groups.get(gid);
        if (childGroup) childGroup.parentId = null;
      }

      this.freeGids.push(group.id);
      for (const cb of this.groupDropCallbacks.values()) {
        try {
          cb(group);
        } catch (err) {
          console.error(err);
        }
      }
      this.updateQuadTree();
    }
  }

  /** Calculates the absolute world position of an entity by traversing its parent group hierarchy. */
  getWorldPosition(entityId: number): Vec2 {
    const entity = this.entities.get(entityId);
    if (!entity) return new Vec2();

    const pos = entity.position.clone();
    let currentParentId = entity.parentId;

    while (currentParentId !== null) {
      const parent = this.groups.get(currentParentId);
      if (!parent) break;
      pos.x += parent.position.x;
      pos.y += parent.position.y;
      currentParentId = parent.parentId;
    }

    return pos;
  }

  /** Calculates the absolute world position of a group by traversing its parent group hierarchy. */
  getGroupWorldPosition(groupId: number): Vec2 {
    const group = this.groups.get(groupId);
    if (!group) return new Vec2();

    const pos = group.position.clone();
    let currentParentId = group.parentId;

    while (currentParentId !== null) {
      const parent = this.groups.get(currentParentId);
      if (!parent) break;
      pos.x += parent.position.x;
      pos.y += parent.position.y;
      currentParentId = parent.parentId;
    }

    return pos;
  }

  /**
   * Moves a group and triggers move notifications for all nested entities recursively.
   * Handles the complex coordinate system updates during group drags.
   */
  moveGroup(group: Group, dx: number, dy: number) {
    const oldBatching = this.isBatchingQuadTree;
    this.isBatchingQuadTree = true;

    group.position.x += dx;
    group.position.y += dy;

    const notifyRecursive = (g: Group) => {
      for (const eid of g.entities) {
        const entity = this.entities.get(eid);
        if (entity) {
          for (const cb of this.entityMoveCallbacks.values()) {
            cb(entity, this.getWorldPosition(eid));
          }
        }
      }
      for (const gid of g.groups) {
        const childGroup = this.groups.get(gid);
        if (childGroup) notifyRecursive(childGroup);
      }
    };

    try {
      notifyRecursive(group);
    } finally {
      this.isBatchingQuadTree = oldBatching;
      this.updateQuadTree();
    }
  }

  /** Adds an entity to a group. Automatically removes it from its previous group if necessary. */
  addToGroup(groupId: number, entityId: number) {
    const group = this.groups.get(groupId);
    const entity = this.entities.get(entityId);
    if (group && entity) {
      if (entity.parentId !== null) {
        this.removeFromGroup(entity.parentId, entityId);
      }
      group.add(entityId);
      entity.parentId = groupId;
      this.updateQuadTree();
    }
  }

  /** Removes an entity from its parent group. */
  removeFromGroup(groupId: number, entityId: number) {
    const group = this.groups.get(groupId);
    const entity = this.entities.get(entityId);
    if (group && entity) {
      group.remove(entityId);
      entity.parentId = null;
      this.updateQuadTree();
    }
  }

  /** Adds a group to a parent group, creating a nested hierarchy. */
  addGroupToGroup(parentGroupId: number, childGroupId: number) {
    const parent = this.groups.get(parentGroupId);
    const child = this.groups.get(childGroupId);
    if (parent && child && parentGroupId !== childGroupId) {
      if (child.parentId !== null) {
        this.removeGroupFromGroup(child.parentId, childGroupId);
      }
      parent.addGroup(childGroupId);
      child.parentId = parentGroupId;
      this.updateQuadTree();
    }
  }

  /** Removes a group from its parent group. */
  removeGroupFromGroup(parentGroupId: number, childGroupId: number) {
    const parent = this.groups.get(parentGroupId);
    const child = this.groups.get(childGroupId);
    if (parent && child) {
      parent.removeGroup(childGroupId);
      child.parentId = null;
      this.updateQuadTree();
    }
  }

  /**
   * Rebuilds or refreshes the QuadTree spatial index.
   * Suspended if `isBatchingQuadTree` is true.
   */
  updateQuadTree() {
    if (this.isBatchingQuadTree) return;

    this.quadTree.clear();
    for (const entity of this.entities.values()) {
      const entityWorldPos = this.getWorldPosition(entity.id);
      this.quadTree.insert(entityWorldPos, entity.id);

      for (const socket of entity.sockets.values()) {
        this.quadTree.insert(
          new Vec2(entityWorldPos.x + socket.offset.x, entityWorldPos.y + socket.offset.y),
          entity.id
        );
      }
    }
  }

  /**
   * Creates a new entity.
   *
   * **Side Effects:**
   * 1. Records 'CREATE_ENTITY' action in history.
   * 2. Triggers `EntityCreateListener`.
   *
   * @param inner Custom data associated with the entity.
   * @param id Optional forced ID.
   * @param parentId Optional parent group ID.
   */
  newEntity(inner: T, id?: number, parentId: number | null = null) {
    const eid = id ?? this.getNextEid();
    const ett = new Entity(eid, inner);
    this.entities.set(ett.id, ett);
    if (id !== undefined) {
      this.eid = Math.max(this.eid, id + 1);
    }

    this.setupEntity(ett);

    if (parentId !== null) {
      this.addToGroup(parentId, ett.id);
    }

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'CREATE_ENTITY',
          id: ett.id,
          inner: ett.inner,
          position: { ...ett.position },
          parentId: ett.parentId
        },
        {
          type: 'DROP_ENTITY',
          id: ett.id,
          inner: ett.inner,
          position: { ...ett.position },
          parentId: ett.parentId
        },
        'Create Entity'
      );
    }

    for (const cb of this.entityCreateCallbacks.values()) {
      try {
        cb(ett);
      } catch (err) {
        console.error(err);
      }
    }
    this.updateQuadTree();
    return ett;
  }

  /**
   * Drops an entity and all its associated sockets and links.
   *
   * **Behaviors:**
   * 1. **Batching:** Performed as a single atomic operation in history.
   * 2. **Recursive Cleanup:** Drops all sockets and links attached to the entity.
   *
   * **Side Effects:**
   * 1. Triggers `EntityDropListener`.
   * 2. Updates QuadTree.
   */
  dropEntity(entity: Entity<T>) {
    if (this.entities.has(entity.id)) {
      this.batch(() => {
        this.record(
          {
            type: 'DROP_ENTITY',
            id: entity.id,
            inner: entity.inner,
            position: { ...entity.position },
            parentId: entity.parentId
          },
          {
            type: 'CREATE_ENTITY',
            id: entity.id,
            inner: entity.inner,
            position: { ...entity.position },
            parentId: entity.parentId
          },
          'Drop Entity'
        );

        if (entity.parentId !== null) {
          this.removeFromGroup(entity.parentId, entity.id);
        }

        this.entities.delete(entity.id);

        for (const socket of entity.sockets.values()) {
          this.dropSocket(socket);
        }

        this.freeEids.push(entity.id);
        for (const cb of this.entityDropCallbacks.values()) {
          try {
            cb(entity);
          } catch (err) {
            console.error(err);
          }
        }
        this.updateQuadTree();
      }, 'Drop Entity');
    }
  }

  /**
   * Adds a new socket to an entity.
   *
   * **Side Effects:**
   * 1. Records 'CREATE_SOCKET' action in history.
   * 2. Triggers `SocketCreateListener`.
   *
   * @param entity The entity to attach the socket to.
   * @param kind INPUT or OUTPUT.
   * @param name Unique name within the entity.
   * @param id Optional forced ID.
   */
  newSocket(entity: Entity<T>, kind: SocketKind, name: string = '', id?: number) {
    const sid = id ?? this.getNextSid();
    const socket = new Socket(sid, entity.id, kind, name);
    this.sockets.set(socket.id, socket);
    entity.sockets.set(socket.id, socket);
    if (id !== undefined) {
      this.sid = Math.max(this.sid, id + 1);
    }

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'CREATE_SOCKET',
          id: socket.id,
          entityId: entity.id,
          kind,
          name: socket.name,
          offset: { ...socket.offset }
        },
        {
          type: 'DROP_SOCKET',
          id: socket.id,
          entityId: entity.id,
          kind,
          name: socket.name,
          offset: { ...socket.offset }
        },
        'Create Socket'
      );
    }

    for (const cb of this.socketCreateCallbacks.values()) {
      try {
        cb(socket);
      } catch (err) {
        console.error(err);
      }
    }
    return socket;
  }

  /**
   * Drops a socket and all links connected to it.
   *
   * **Side Effects:**
   * 1. Triggers `SocketDropListener`.
   * 2. Recursively drops all links connected to this socket.
   */
  dropSocket(socket: Socket) {
    if (this.sockets.delete(socket.id)) {
      if (!this.isApplyingHistory) {
        this.record(
          {
            type: 'DROP_SOCKET',
            id: socket.id,
            entityId: socket.entityId,
            kind: socket.kind,
            name: socket.name,
            offset: { ...socket.offset }
          },
          {
            type: 'CREATE_SOCKET',
            id: socket.id,
            entityId: socket.entityId,
            kind: socket.kind,
            name: socket.name,
            offset: { ...socket.offset }
          },
          'Drop Socket'
        );
      }
      const entity = this.entities.get(socket.entityId);
      if (entity) {
        entity.sockets.delete(socket.id);
      }

      for (const link of this.links.values()) {
        if (link.from === socket.id || link.to === socket.id) {
          this.dropLink(link);
        }
      }

      this.freeSids.push(socket.id);
      for (const cb of this.socketDropCallbacks.values()) {
        try {
          cb(socket);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  /**
   * Creates a new link between two sockets.
   *
   * **Validation:** Prevents self-loops, same-entity links, identical kind connections, duplicate links, and cycles.
   *
   * **Side Effects:**
   * 1. Records 'CREATE_LINK' action in history.
   * 2. Propagates value from `from` socket to `to` socket.
   * 3. Triggers `LinkCreateListener`.
   *
   * @param options Configuration for the new link.
   */
  newLink(options: {
    from: Socket;
    to: Socket;
    kind?: LinkKind | undefined;
    id?: number | undefined;
    inner?: any | undefined;
    styling?: LinkStyling | undefined;
  }) {
    const { from, to, kind = LinkKind.BEZIER, id: forcedId, inner = {}, styling } = options;

    if (!this.canLink(from, to)) {
      return null;
    }
    const id = forcedId ?? this.getNextLid();
    const link = new Link(id, from.id, to.id, kind, inner);
    if (styling) link.styling = { ...link.styling, ...styling };
    this.links.set(link.id, link);
    if (forcedId !== undefined) {
      this.lid = Math.max(this.lid, forcedId + 1);
    }

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'CREATE_LINK',
          id: link.id,
          from: link.from,
          to: link.to,
          kind: link.kind,
          styling: { ...link.styling },
          inner: link.inner
        },
        {
          type: 'DROP_LINK',
          id: link.id,
          from: link.from,
          to: link.to,
          kind: link.kind,
          styling: { ...link.styling },
          inner: link.inner
        },
        'Create Link'
      );
    }

    if (from.value !== null) {
      this.setSocketValue(to.id, from.value);
    }

    for (const cb of this.linkCreateCallbacks.values()) {
      try {
        cb(link);
      } catch (err) {
        console.error(err);
      }
    }
    return link;
  }

  /** Updates a link's aesthetic styling and animations. */
  updateLinkStyling(link: Link, styling: Partial<LinkStyling>) {
    const oldStyling = { ...link.styling };
    const newStyling = { ...link.styling, ...styling };

    if (JSON.stringify(oldStyling) === JSON.stringify(newStyling)) return;

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'UPDATE_LINK_STYLING',
          id: link.id,
          from: oldStyling,
          to: newStyling
        },
        {
          type: 'UPDATE_LINK_STYLING',
          id: link.id,
          from: newStyling,
          to: oldStyling
        },
        'Update Link Styling'
      );
    }

    link.styling = newStyling;

    for (const cb of this.linkUpdateCallbacks.values()) {
      try {
        cb(link);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /** Updates an existing link's source or target. */
  updateLink(link: Link, fromId?: number, toId?: number) {
    const oldFrom = link.from;
    const oldTo = link.to;
    const newFrom = fromId ?? oldFrom;
    const newTo = toId ?? oldTo;

    if (oldFrom === newFrom && oldTo === newTo) return;

    const fromSocket = this.sockets.get(newFrom);
    const toSocket = this.sockets.get(newTo);

    if (!fromSocket || !toSocket || !this.canLink(fromSocket, toSocket)) {
      return;
    }

    const oldWaypoints = link.waypoints.map((p) => ({ x: p.x, y: p.y }));

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'UPDATE_LINK',
          id: link.id,
          from: { old: oldFrom, new: newFrom },
          to: { old: oldTo, new: newTo },
          waypoints: { old: oldWaypoints, new: oldWaypoints }
        },
        {
          type: 'UPDATE_LINK',
          id: link.id,
          from: { old: newFrom, new: oldFrom },
          to: { old: newTo, new: oldTo },
          waypoints: { old: oldWaypoints, new: oldWaypoints }
        },
        'Update Link'
      );
    }

    link.from = newFrom;
    link.to = newTo;

    for (const cb of this.linkUpdateCallbacks.values()) {
      try {
        cb(link);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /** Sets custom routing waypoints for a link. */
  setLinkWaypoints(link: Link, waypoints: Vec2[]) {
    const oldWaypoints = link.waypoints.map((p) => ({ x: p.x, y: p.y }));
    const newWaypoints = waypoints.map((p) => ({ x: p.x, y: p.y }));

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'UPDATE_LINK',
          id: link.id,
          from: { old: link.from, new: link.from },
          to: { old: link.to, new: link.to },
          waypoints: { old: oldWaypoints, new: newWaypoints }
        },
        {
          type: 'UPDATE_LINK',
          id: link.id,
          from: { old: link.from, new: link.from },
          to: { old: link.to, new: link.to },
          waypoints: { old: newWaypoints, new: oldWaypoints }
        },
        'Update Link Routing'
      );
    }

    link.waypoints = waypoints.map((p) => p.clone());

    for (const cb of this.linkUpdateCallbacks.values()) {
      try {
        cb(link);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /**
   * Validation logic for connections.
   * Prevents self-loops, same-entity links, identical kind connections,
   * duplicate links, and cycles.
   */
  canLink(from: Socket, to: Socket) {
    if (from.id === to.id) return false;
    if (from.entityId === to.entityId) return false;
    if (from.kind === to.kind) return false;
    for (const link of this.links.values()) {
      if (
        (link.from === from.id && link.to === to.id) ||
        (link.from === to.id && link.to === from.id)
      ) {
        return false;
      }
    }

    if (this.detectCycle(from, to)) {
      return false;
    }

    return true;
  }

  /** Performs a cycle detection search in the graph. */
  detectCycle(from: Socket, to: Socket): boolean {
    const visited = new Set<number>();
    const stack = [to.entityId];

    while (stack.length > 0) {
      const currentEntityId = stack.pop()!;
      if (currentEntityId === from.entityId) return true;
      if (visited.has(currentEntityId)) continue;
      visited.add(currentEntityId);

      const entity = this.entities.get(currentEntityId);
      if (!entity) continue;

      for (const socket of entity.sockets.values()) {
        if (socket.kind === SocketKind.OUTPUT) {
          for (const link of this.links.values()) {
            if (link.from === socket.id) {
              const targetSocket = this.sockets.get(link.to);
              if (targetSocket) {
                stack.push(targetSocket.entityId);
              }
            }
          }
        }
      }
    }

    return false;
  }

  /** Deletes a link from the context. */
  dropLink(link: Link) {
    if (this.links.delete(link.id)) {
      if (!this.isApplyingHistory) {
        this.record(
          {
            type: 'DROP_LINK',
            id: link.id,
            from: link.from,
            to: link.to,
            kind: link.kind,
            inner: link.inner
          },
          {
            type: 'CREATE_LINK',
            id: link.id,
            from: link.from,
            to: link.to,
            kind: link.kind,
            inner: link.inner
          },
          'Drop Link'
        );
      }
      this.freeLids.push(link.id);
      for (const cb of this.linkDropCallbacks.values()) {
        try {
          cb(link);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  /** Serializes the entire context state into a JSON-compatible object. */
  toJSON() {
    return {
      entities: Array.from(this.entities.values()).map((e) => ({
        id: e.id,
        position: { x: e.position.x, y: e.position.y },
        inner: e.inner,
        parentId: e.parentId,
        sockets: Array.from(e.sockets.values()).map((s) => ({
          id: s.id,
          kind: s.kind,
          name: s.name,
          offset: { x: s.offset.x, y: s.offset.y }
        }))
      })),
      links: Array.from(this.links.values()).map((l) => ({
        id: l.id,
        from: l.from,
        to: l.to,
        kind: l.kind,
        styling: l.styling,
        waypoints: l.waypoints.map((p) => ({ x: p.x, y: p.y })),
        inner: l.inner
      })),
      groups: Array.from(this.groups.values()).map((g) => ({
        id: g.id,
        name: g.name,
        entities: Array.from(g.entities),
        groups: Array.from(g.groups),
        position: { x: g.position.x, y: g.position.y },
        parentId: g.parentId
      }))
    };
  }

  /**
   * Restores the context state from a serialized JSON object.
   * **Note:** This clears the current state completely.
   */
  fromJSON(data: any) {
    this.entities.clear();
    this.links.clear();
    this.sockets.clear();
    this.groups.clear();
    this.eid = 0;
    this.lid = 0;
    this.sid = 0;
    this.gid = 0;
    this.freeEids = [];
    this.freeLids = [];
    this.freeSids = [];
    this.freeGids = [];

    for (const eData of data.entities) {
      const entity = new Entity(eData.id, eData.inner);
      entity.position.set(eData.position.x, eData.position.y);
      entity.parentId = eData.parentId;
      this.entities.set(entity.id, entity);
      this.eid = Math.max(this.eid, entity.id + 1);

      this.setupEntity(entity);

      for (const sData of eData.sockets) {
        const socket = new Socket(sData.id, entity.id, sData.kind, sData.name);
        socket.offset.set(sData.offset.x, sData.offset.y);
        this.sockets.set(socket.id, socket);
        entity.sockets.set(socket.id, socket);
        this.sid = Math.max(this.sid, socket.id + 1);
      }
    }

    for (const lData of data.links) {
      const link = new Link(lData.id, lData.from, lData.to, lData.kind, lData.inner);
      if (lData.styling) link.styling = { ...link.styling, ...lData.styling };
      if (lData.waypoints) {
        link.waypoints = lData.waypoints.map((p: any) => new Vec2(p.x, p.y));
      }
      this.links.set(link.id, link);
      this.lid = Math.max(this.lid, link.id + 1);
    }

    if (data.groups) {
      for (const gData of data.groups) {
        const group = new Group(gData.id, gData.name);
        group.position.set(gData.position.x, gData.position.y);
        group.parentId = gData.parentId;
        for (const eid of gData.entities) {
          group.add(eid);
        }
        if (gData.groups) {
          for (const gid of gData.groups) {
            group.addGroup(gid);
          }
        }
        this.groups.set(group.id, group);
        this.gid = Math.max(this.gid, group.id + 1);
      }
    }
    this.updateQuadTree();
  }
}
