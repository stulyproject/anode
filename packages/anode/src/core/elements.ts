export class Vec2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(other: Vec2) {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }
}

export enum SocketKind {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

/** A connection point on an entity */
export class Socket {
  #id: number;
  entityId: number;
  kind: SocketKind;
  name: string;
  offset: Vec2 = new Vec2();
  value: any = null;

  constructor(id: number, entityId: number, kind: SocketKind, name: string = '') {
    this.#id = id;
    this.entityId = entityId;
    this.kind = kind;
    this.name = name;
  }

  get id() {
    return this.#id;
  }
}

/** An element of the node */
export class Entity<T = any> {
  inner: T;
  position: Vec2 = new Vec2();
  sockets: Map<number, Socket> = new Map();
  #id: number;
  #onMove: ((pos: Vec2) => void)[] = [];
  parentId: number | null = null;

  constructor(id: number, inner: T) {
    this.#id = id;
    this.inner = inner;
  }

  setInner(newInner: T) {
    this.inner = newInner;
  }

  get id() {
    return this.#id;
  }

  move(x: number, y: number) {
    this.position.set(x, y);
    for (const cb of this.#onMove) {
      cb(this.position);
    }
  }

  onMove(cb: (pos: Vec2) => void) {
    this.#onMove.push(cb);
    return () => {
      this.#onMove = this.#onMove.filter((c) => c !== cb);
    };
  }
}

/** A group of entities */
export class Group {
  #id: number;
  name: string;
  entities: Set<number> = new Set();
  groups: Set<number> = new Set();
  position: Vec2 = new Vec2();
  parentId: number | null = null;

  constructor(id: number, name: string = '') {
    this.#id = id;
    this.name = name;
  }

  get id() {
    return this.#id;
  }

  add(entityId: number) {
    this.entities.add(entityId);
  }

  remove(entityId: number) {
    this.entities.delete(entityId);
  }

  addGroup(groupId: number) {
    this.groups.add(groupId);
  }

  removeGroup(groupId: number) {
    this.groups.delete(groupId);
  }
}

export enum LinkKind {
  LINE = 'LINE',
  STEP = 'STEP',
  SMOOTH_STEP = 'SMOOTH_STEP',
  BEZIER = 'BEZIER'
}

/** A connection between sockets */
export class Link {
  #id: number;
  from: number; // Socket ID
  to: number; // Socket ID
  kind: LinkKind;
  waypoints: Vec2[] = [];

  constructor(id: number, from: number, to: number, kind = LinkKind.LINE) {
    this.#id = id;
    this.from = from;
    this.to = to;
    this.kind = kind;
  }

  get id() {
    return this.#id;
  }
}
