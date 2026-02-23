import { Entity, Link, LinkKind, Socket, SocketKind, Vec2, Group } from './elements';

export type EntityCallback<T> = (entity: Entity<T>) => void;
export type LinkCallback = (link: Link) => void;
export type SocketCallback = (socket: Socket) => void;
export type EntityMoveCallback<T> = (entity: Entity<T>, pos: Vec2) => void;
export type GroupCallback = (group: Group) => void;
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

  private linkCreateCallbacks: Map<number, LinkCallback> = new Map();
  private linkDropCallbacks: Map<number, LinkCallback> = new Map();

  private socketCreateCallbacks: Map<number, SocketCallback> = new Map();
  private socketDropCallbacks: Map<number, SocketCallback> = new Map();

  private groupCreateCallbacks: Map<number, GroupCallback> = new Map();
  private groupDropCallbacks: Map<number, GroupCallback> = new Map();

  entities: Map<number, Entity<T>> = new Map();
  links: Map<number, Link> = new Map();
  sockets: Map<number, Socket> = new Map();
  groups: Map<number, Group> = new Map();

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
      this.entityCreateCallbacks.delete(handle) ||
      this.entityDropCallbacks.delete(handle) ||
      this.entityMoveCallbacks.delete(handle) ||
      this.socketCreateCallbacks.delete(handle) ||
      this.socketDropCallbacks.delete(handle) ||
      this.groupCreateCallbacks.delete(handle) ||
      this.groupDropCallbacks.delete(handle);

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
      this.freeGids.push(group.id);
      for (const cb of this.groupDropCallbacks.values()) {
        try {
          cb(group);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  moveGroup(group: Group, dx: number, dy: number) {
    group.position.x += dx;
    group.position.y += dy;
    for (const eid of group.entities) {
      const entity = this.entities.get(eid);
      if (entity) {
        entity.move(entity.position.x + dx, entity.position.y + dy);
      }
    }
  }

  newEntity(inner: T) {
    const ett = new Entity(this.getNextEid(), inner);
    this.entities.set(ett.id, ett);

    // Register move listener automatically to bridge to context listeners
    ett.onMove((pos) => {
      for (const cb of this.entityMoveCallbacks.values()) {
        try {
          cb(ett, pos);
        } catch (err) {
          console.error(err);
        }
      }
    });

    for (const cb of this.entityCreateCallbacks.values()) {
      try {
        cb(ett);
      } catch (err) {
        console.error(err);
      }
    }
    return ett;
  }

  dropEntity(entity: Entity<T>) {
    if (this.entities.delete(entity.id)) {
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
    }
  }

  newSocket(entity: Entity<T>, kind: SocketKind, name: string = '') {
    const socket = new Socket(this.getNextSid(), entity.id, kind, name);
    this.sockets.set(socket.id, socket);
    entity.sockets.set(socket.id, socket);

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

  newLink(from: Socket, to: Socket, kind: LinkKind = LinkKind.LINE) {
    if (!this.canLink(from, to)) {
      return null;
    }
    const link = new Link(this.getNextLid(), from.id, to.id, kind);
    this.links.set(link.id, link);

    for (const cb of this.linkCreateCallbacks.values()) {
      try {
        cb(link);
      } catch (err) {
        console.error(err);
      }
    }
    return link;
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
    return true;
  }

  dropLink(link: Link) {
    if (this.links.delete(link.id)) {
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
        kind: l.kind
      })),
      groups: Array.from(this.groups.values()).map((g) => ({
        id: g.id,
        name: g.name,
        entities: Array.from(g.entities),
        position: { x: g.position.x, y: g.position.y }
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
      this.entities.set(entity.id, entity);
      this.eid = Math.max(this.eid, entity.id + 1);

      for (const sData of eData.sockets) {
        const socket = new Socket(sData.id, entity.id, sData.kind, sData.name);
        socket.offset.set(sData.offset.x, sData.offset.y);
        this.sockets.set(socket.id, socket);
        entity.sockets.set(socket.id, socket);
        this.sid = Math.max(this.sid, socket.id + 1);
      }
    }

    for (const lData of data.links) {
      const link = new Link(lData.id, lData.from, lData.to, lData.kind);
      this.links.set(link.id, link);
      this.lid = Math.max(this.lid, link.id + 1);
    }

    if (data.groups) {
      for (const gData of data.groups) {
        const group = new Group(gData.id, gData.name);
        group.position.set(gData.position.x, gData.position.y);
        for (const eid of gData.entities) {
          group.add(eid);
        }
        this.groups.set(group.id, group);
        this.gid = Math.max(this.gid, group.id + 1);
      }
    }
  }
}
