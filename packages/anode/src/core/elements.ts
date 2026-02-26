/** Simple 2D Vector class for coordinates and offsets. */
export class Vec2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  /** Sets the x and y components. Returns this instance for chaining. */
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  /** Copies values from another Vec2. Returns this instance for chaining. */
  copy(other: Vec2) {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  /** Returns a new Vec2 with the same x and y values. */
  clone() {
    return new Vec2(this.x, this.y);
  }
}

/** Defines the direction of data flow for a socket. */
export enum SocketKind {
  /** Accepts incoming data flow from a link. */
  INPUT = 'INPUT',
  /** Emits outgoing data flow into a link. */
  OUTPUT = 'OUTPUT'
}

/**
 * A connection point on an entity.
 * Sockets manage data flow values and their relative offset from the node's center.
 */
export class Socket {
  #id: number;
  /** The ID of the entity this socket belongs to. */
  entityId: number;
  /** Whether this socket is an INPUT or OUTPUT. */
  kind: SocketKind;
  /** A unique name for the socket within the entity (e.g., 'exec', 'value'). */
  name: string;
  /** The relative offset of the socket center from the entity's position center. */
  offset: Vec2 = new Vec2();
  /** The current value held by this socket, used for reactive data flow. */
  value: any = null;

  constructor(id: number, entityId: number, kind: SocketKind, name: string = '') {
    this.#id = id;
    this.entityId = entityId;
    this.kind = kind;
    this.name = name;
  }

  /** Unique identifier for the socket. */
  get id() {
    return this.#id;
  }
}

/**
 * A primary node element in the graph.
 *
 * Entities have a position, custom inner data, and a collection of sockets.
 * @template T The type of custom data stored in the `inner` property.
 */
export class Entity<T = any> {
  /** Custom data associated with the node. */
  inner: T;
  /** The local position of the entity (relative to its parent group if applicable). */
  position: Vec2 = new Vec2();
  /** Collection of sockets attached to this entity. */
  sockets: Map<number, Socket> = new Map();
  #id: number;
  #onMove: ((pos: Vec2) => void)[] = [];
  /** The ID of the parent group, or null if it's at the root. */
  parentId: number | null = null;

  constructor(id: number, inner: T) {
    this.#id = id;
    this.inner = inner;
  }

  /** Updates the custom data for this entity. */
  setInner(newInner: T) {
    this.inner = newInner;
  }

  /** Unique identifier for the entity. */
  get id() {
    return this.#id;
  }

  /**
   * Updates the entity's local position and triggers internal move listeners.
   * **Note:** This is usually called by the Context engine.
   */
  move(x: number, y: number) {
    this.position.set(x, y);
    for (const cb of this.#onMove) {
      cb(this.position);
    }
  }

  /**
   * Internal subscription for position changes.
   * Used by the Context to keep the QuadTree synchronized.
   */
  onMove(cb: (pos: Vec2) => void) {
    this.#onMove.push(cb);
    return () => {
      this.#onMove = this.#onMove.filter((c) => c !== cb);
    };
  }
}

/**
 * A hierarchical container for entities and other groups.
 * Groups allow for organized topology and relative coordinate systems.
 */
export class Group {
  #id: number;
  /** Human-readable label for the group. */
  name: string;
  /** Set of entity IDs currently inside this group. */
  entities: Set<number> = new Set();
  /** Set of nested group IDs currently inside this group. */
  groups: Set<number> = new Set();
  /** The local position of the group (relative to its parent group if applicable). */
  position: Vec2 = new Vec2();
  /** The ID of the parent group, or null if it's at the root. */
  parentId: number | null = null;

  constructor(id: number, name: string = '') {
    this.#id = id;
    this.name = name;
  }

  /** Unique identifier for the group. */
  get id() {
    return this.#id;
  }

  /** Internal: Adds an entity ID to the group set. */
  add(entityId: number) {
    this.entities.add(entityId);
  }

  /** Internal: Removes an entity ID from the group set. */
  remove(entityId: number) {
    this.entities.delete(entityId);
  }

  /** Internal: Adds a group ID to the nested groups set. */
  addGroup(groupId: number) {
    this.groups.add(groupId);
  }

  /** Internal: Removes a group ID from the nested groups set. */
  removeGroup(groupId: number) {
    this.groups.delete(groupId);
  }
}

/** Visual routing style for a link. */
export enum LinkKind {
  /** Straight line between sockets. */
  LINE = 'LINE',
  /** Orthogonal steps with sharp corners. */
  STEP = 'STEP',
  /** Orthogonal steps with rounded corners. */
  SMOOTH_STEP = 'SMOOTH_STEP',
  /** Smooth cubic bezier curve. */
  BEZIER = 'BEZIER'
}

/**
 * A connection between two sockets.
 * Links define the topology of the graph and the path for data flow.
 * @template T Type of optional custom data associated with the link.
 */
export class Link<T = any> {
  #id: number;
  /** Source Socket ID. Must be an OUTPUT. */
  from: number;
  /** Target Socket ID. Must be an INPUT. */
  to: number;
  /** Visual style for the link. */
  kind: LinkKind;
  /** Custom intermediate points for routing the link path. */
  waypoints: Vec2[] = [];
  /** Optional custom data for the link (e.g., labels, types). */
  inner: T;

  constructor(id: number, from: number, to: number, kind = LinkKind.LINE, inner: T = {} as T) {
    this.#id = id;
    this.from = from;
    this.to = to;
    this.kind = kind;
    this.inner = inner;
  }

  /** Unique identifier for the link. */
  get id() {
    return this.#id;
  }
}
