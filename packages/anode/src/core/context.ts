import { Entity, Link, LinkKind, Socket, SocketKind, Vec2, Group } from './elements';
import { QuadTree, Rect } from './layout';
import { HistoryManager, type HistoryAction, type Command } from './history';

export type EntityCallback<T> = (entity: Entity<T>) => void;
export type LinkCallback = (link: Link) => void;
export type SocketCallback = (socket: Socket) => void;
export type EntityMoveCallback<T> = (entity: Entity<T>, pos: Vec2) => void;
export type GroupCallback = (group: Group) => void;
export type SocketValueCallback = (socket: Socket, value: any) => void;
export type CallbackHandle = number;

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

  entities: Map<number, Entity<T>> = new Map();
  links: Map<number, Link> = new Map();
  sockets: Map<number, Socket> = new Map();
  groups: Map<number, Group> = new Map();

  quadTree: QuadTree<number> = new QuadTree(new Rect(-100000, -100000, 200000, 200000));
  history: HistoryManager = new HistoryManager();
  private isApplyingHistory: boolean = false;
  private currentBatch: HistoryAction[] | null = null;
  private currentUndoBatch: HistoryAction[] | null = null;
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
    entity.onMove((pos) => {
      this.updateQuadTree();
      for (const cb of this.entityMoveCallbacks.values()) {
        try {
          cb(entity, this.getWorldPosition(entity.id));
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  notifyBulkChange() {
    for (const cb of this.bulkChangeCallbacks.values()) {
      try {
        cb();
      } catch (err) {
        console.error(err);
      }
    }
  }

  registerBulkChangeListener(cb: () => void): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.bulkChangeCallbacks.set(handle, cb);
    return handle;
  }

  setSocketValue(socketId: number, value: any) {
    const socket = this.sockets.get(socketId);
    if (!socket) return;

    socket.value = value;

    // Notify listeners for this specific socket
    for (const cb of this.socketValueCallbacks.values()) {
      cb(socket, value);
    }

    // If it's an OUTPUT, propagate to all linked INPUTs
    if (socket.kind === SocketKind.OUTPUT) {
      for (const link of this.links.values()) {
        if (link.from === socketId) {
          this.setSocketValue(link.to, value);
        }
      }
    }
  }

  registerSocketValueListener(cb: SocketValueCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketValueCallbacks.set(handle, cb);
    return handle;
  }

  record(
    doActions: HistoryAction | HistoryAction[],
    undoActions: HistoryAction | HistoryAction[],
    label?: string
  ) {
    if (this.isApplyingHistory) return;

    // If we are in a batch, we don't record individual actions to history
    // We let the batch() method handle the combined history entry
    if (this.currentBatch) {
      return;
    }

    const das = Array.isArray(doActions) ? doActions : [doActions];
    const uas = Array.isArray(undoActions) ? undoActions : [undoActions];

    this.history.push({
      do: das,
      undo: uas,
      label: label ?? 'Action',
      timestamp: Date.now()
    });
  }

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
  undo() {
    const cmd = this.history.undoStack.pop();
    if (!cmd) return;
    this.isApplyingHistory = true;
    this.isBatchingQuadTree = true;
    try {
      for (let i = cmd.undo.length - 1; i >= 0; i--) {
        this.applyAction(cmd.undo[i]!);
      }
      this.isBatchingQuadTree = false;
      this.updateQuadTree();
      this.notifyBulkChange();
      this.history.redoStack.push(cmd);
    } finally {
      this.isApplyingHistory = false;
      this.isBatchingQuadTree = false;
    }
  }

  redo() {
    const cmd = this.history.redoStack.pop();
    if (!cmd) return;
    this.isApplyingHistory = true;
    this.isBatchingQuadTree = true;
    try {
      for (const action of cmd.do) {
        this.applyAction(action);
      }
      this.isBatchingQuadTree = false;
      this.updateQuadTree();
      this.notifyBulkChange();
      this.history.undoStack.push(cmd);
    } finally {
      this.isApplyingHistory = false;
      this.isBatchingQuadTree = false;
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
          for (const cb of this.entityMoveCallbacks.values())
            cb(entity, this.getWorldPosition(entity.id));
          this.updateQuadTree();
        }
        break;
      }
      case 'MOVE_GROUP': {
        const group = this.groups.get(action.id);
        if (group) {
          const dx = action.to.x - action.from.x;
          const dy = action.to.y - action.from.y;
          const oldApplying = this.isApplyingHistory;
          this.isApplyingHistory = true;
          try {
            this.moveGroup(group, dx, dy);
          } finally {
            this.isApplyingHistory = oldApplying;
          }
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
        this.updateQuadTree();
        break;
      }
      case 'DROP_ENTITY': {
        const entity = this.entities.get(action.id);
        if (entity) {
          const oldApplying = this.isApplyingHistory;
          this.isApplyingHistory = true;
          try {
            this.dropEntity(entity);
          } finally {
            this.isApplyingHistory = oldApplying;
          }
        }
        break;
      }
      case 'CREATE_LINK': {
        const from = this.sockets.get(action.from);
        const to = this.sockets.get(action.to);
        if (from && to) {
          const link = new Link(action.id, from.id, to.id, action.kind, action.inner);
          this.links.set(link.id, link);
          this.lid = Math.max(this.lid, link.id + 1);
          for (const cb of this.linkCreateCallbacks.values()) cb(link);
        }
        break;
      }
      case 'DROP_LINK': {
        const link = this.links.get(action.id);
        if (link) {
          const oldApplying = this.isApplyingHistory;
          this.isApplyingHistory = true;
          try {
            this.dropLink(link);
          } finally {
            this.isApplyingHistory = oldApplying;
          }
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
          const oldApplying = this.isApplyingHistory;
          this.isApplyingHistory = true;
          try {
            this.dropSocket(socket);
          } finally {
            this.isApplyingHistory = oldApplying;
          }
        }
        break;
      }
    }
  }

  registerEntityCreateListener(cb: EntityCallback<T>): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.entityCreateCallbacks.set(handle, cb);
    return handle;
  }

  registerEntityDropListener(cb: EntityCallback<T>): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.entityDropCallbacks.set(handle, cb);
    return handle;
  }

  registerEntityMoveListener(cb: EntityMoveCallback<T>): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.entityMoveCallbacks.set(handle, cb);
    return handle;
  }

  registerSocketMoveListener(cb: SocketCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketMoveCallbacks.set(handle, cb);
    return handle;
  }

  notifySocketMove(socket: Socket) {
    for (const cb of this.socketMoveCallbacks.values()) {
      try {
        cb(socket);
      } catch (err) {
        console.error(err);
      }
    }
  }

  registerLinkCreateListener(cb: LinkCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.linkCreateCallbacks.set(handle, cb);
    return handle;
  }

  registerLinkDropListener(cb: LinkCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.linkDropCallbacks.set(handle, cb);
    return handle;
  }

  registerLinkUpdateListener(cb: LinkCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.linkUpdateCallbacks.set(handle, cb);
    return handle;
  }

  registerSocketCreateListener(cb: SocketCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketCreateCallbacks.set(handle, cb);
    return handle;
  }

  registerSocketDropListener(cb: SocketCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.socketDropCallbacks.set(handle, cb);
    return handle;
  }

  registerGroupCreateListener(cb: GroupCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.groupCreateCallbacks.set(handle, cb);
    return handle;
  }

  registerGroupDropListener(cb: GroupCallback): CallbackHandle {
    const handle = this.getNextCallbackHandle();
    this.groupDropCallbacks.set(handle, cb);
    return handle;
  }

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

  newGroup(name: string = '') {
    const group = new Group(this.getNextGid(), name);
    this.groups.set(group.id, group);
    for (const cb of this.groupCreateCallbacks.values()) {
      try {
        cb(group);
      } catch (err) {
        console.error(err);
      }
    }
    return group;
  }

  dropGroup(group: Group) {
    if (this.groups.delete(group.id)) {
      if (group.parentId !== null) {
        this.removeGroupFromGroup(group.parentId, group.id);
      }
      // Detach all entities
      for (const eid of group.entities) {
        const entity = this.entities.get(eid);
        if (entity) entity.parentId = null;
      }
      // Detach all nested groups
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

  moveGroup(group: Group, dx: number, dy: number) {
    const oldBatching = this.isBatchingQuadTree;
    this.isBatchingQuadTree = true;

    group.position.x += dx;
    group.position.y += dy;

    // Notify about moves for all nested entities recursively
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

  addToGroup(groupId: number, entityId: number) {
    const group = this.groups.get(groupId);
    const entity = this.entities.get(entityId);
    if (group && entity) {
      // If already in a group, remove it
      if (entity.parentId !== null) {
        this.removeFromGroup(entity.parentId, entityId);
      }
      group.add(entityId);
      entity.parentId = groupId;
      this.updateQuadTree();
    }
  }

  removeFromGroup(groupId: number, entityId: number) {
    const group = this.groups.get(groupId);
    const entity = this.entities.get(entityId);
    if (group && entity) {
      group.remove(entityId);
      entity.parentId = null;
      this.updateQuadTree();
    }
  }

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

  removeGroupFromGroup(parentGroupId: number, childGroupId: number) {
    const parent = this.groups.get(parentGroupId);
    const child = this.groups.get(childGroupId);
    if (parent && child) {
      parent.removeGroup(childGroupId);
      child.parentId = null;
      this.updateQuadTree();
    }
  }

  updateQuadTree() {
    if (this.isBatchingQuadTree) return;

    this.quadTree.clear();
    for (const entity of this.entities.values()) {
      const entityWorldPos = this.getWorldPosition(entity.id);
      // Index entity top-left
      this.quadTree.insert(entityWorldPos, entity.id);

      // Index every socket world position
      for (const socket of entity.sockets.values()) {
        this.quadTree.insert(
          new Vec2(entityWorldPos.x + socket.offset.x, entityWorldPos.y + socket.offset.y),
          entity.id
        );
      }
    }
  }

  newEntity(inner: T, forcedId?: number) {
    const id = forcedId ?? this.getNextEid();
    const ett = new Entity(id, inner);
    this.entities.set(ett.id, ett);
    if (forcedId !== undefined) {
      this.eid = Math.max(this.eid, forcedId + 1);
    }

    this.setupEntity(ett);

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

  dropEntity(entity: Entity<T>) {
    if (this.entities.has(entity.id)) {
      this.batch(() => {
        // Record entity drop itself
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

        // Drop all sockets of this entity
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

  newSocket(entity: Entity<T>, kind: SocketKind, name: string = '', forcedId?: number) {
    const id = forcedId ?? this.getNextSid();
    const socket = new Socket(id, entity.id, kind, name);
    this.sockets.set(socket.id, socket);
    entity.sockets.set(socket.id, socket);
    if (forcedId !== undefined) {
      this.sid = Math.max(this.sid, forcedId + 1);
    }

    if (!this.isApplyingHistory) {
      this.record(
        {
          type: 'CREATE_SOCKET',
          id: socket.id,
          entityId: entity.id,
          kind,
          name,
          offset: { ...socket.offset }
        },
        {
          type: 'DROP_SOCKET',
          id: socket.id,
          entityId: entity.id,
          kind,
          name,
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

      // Drop all links connected to this socket
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

  newLink(
    from: Socket,
    to: Socket,
    kind: LinkKind = LinkKind.LINE,
    forcedId?: number,
    inner: any = {}
  ) {
    if (!this.canLink(from, to)) {
      return null;
    }
    const id = forcedId ?? this.getNextLid();
    const link = new Link(id, from.id, to.id, kind, inner);
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
          inner: link.inner
        },
        {
          type: 'DROP_LINK',
          id: link.id,
          from: link.from,
          to: link.to,
          kind: link.kind,
          inner: link.inner
        },
        'Create Link'
      );
    }

    // Immediate propagation: If the source has a value, push it to the target
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

  canLink(from: Socket, to: Socket) {
    if (from.id === to.id) return false;
    if (from.entityId === to.entityId) return false;
    if (from.kind === to.kind) return false;
    // Don't allow multiple links between same sockets
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

  detectCycle(from: Socket, to: Socket): boolean {
    const visited = new Set<number>();
    const stack = [to.entityId];

    while (stack.length > 0) {
      const currentEntityId = stack.pop()!;
      if (currentEntityId === from.entityId) return true;
      if (visited.has(currentEntityId)) continue;
      visited.add(currentEntityId);

      // Find all outgoing links from this entity
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
