import { Context } from './context';
import { Link, Vec2, LinkKind } from './elements';

/**
 * Calculates the start and end world coordinates for a link's path.
 * Resolves entity and parent group positions to get absolute coordinates.
 */
export function getLinkPoints(ctx: Context, link: Link): { from: Vec2; to: Vec2 } | null {
  const fromSocket = ctx.sockets.get(link.from);
  const toSocket = ctx.sockets.get(link.to);

  if (!fromSocket || !toSocket) {
    return null;
  }

  const fromEntity = ctx.entities.get(fromSocket.entityId);
  const toEntity = ctx.entities.get(toSocket.entityId);

  if (!fromEntity || !toEntity) return null;

  const fromWorldPos = ctx.getWorldPosition(fromEntity.id);
  const toWorldPos = ctx.getWorldPosition(toEntity.id);

  return {
    from: new Vec2(fromWorldPos.x + fromSocket.offset.x, fromWorldPos.y + fromSocket.offset.y),
    to: new Vec2(toWorldPos.x + toSocket.offset.x, toWorldPos.y + toSocket.offset.y)
  };
}

/**
 * Calculates the visual center point of a link.
 * Used for positioning labels or custom UI overlays.
 */
export function getLinkCenter(ctx: Context, link: Link): Vec2 | null {
  const pts = getLinkPoints(ctx, link);
  if (!pts) return null;

  const points = [pts.from, ...link.waypoints, pts.to];
  if (points.length < 2) return null;

  const midIndex = Math.floor((points.length - 1) / 2);
  const p1 = points[midIndex]!;
  const p2 = points[midIndex + 1]!;

  return new Vec2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

/**
 * Generates an SVG path string for a link based on its `kind` and `waypoints`.
 */
export function getLinkPath(ctx: Context, link: Link): string | null {
  const pts = getLinkPoints(ctx, link);
  if (!pts) return null;

  const { from: fromPos, to: toPos } = pts;
  const points = [fromPos, ...link.waypoints, toPos];

  if (link.kind === LinkKind.LINE) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  if (link.kind === LinkKind.BEZIER) {
    if (points.length === 2) {
      const p1 = points[0]!;
      const p2 = points[1]!;
      const dx = Math.abs(p1.x - p2.x);
      const offset = Math.max(dx / 2, 50);
      return `M ${p1.x} ${p1.y} C ${p1.x + offset} ${p1.y}, ${p2.x - offset} ${p2.y}, ${p2.x} ${p2.y}`;
    }

    let path = `M ${points[0]!.x} ${points[0]!.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const dx = Math.abs(p1.x - p2.x);
      const offset = Math.max(dx / 2, 20);
      path += ` C ${p1.x + offset} ${p1.y}, ${p2.x - offset} ${p2.y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }

  if (link.kind === LinkKind.STEP || link.kind === LinkKind.SMOOTH_STEP) {
    const isSmooth = link.kind === LinkKind.SMOOTH_STEP;
    const borderRadius = 10;
    const minOffset = 20; // Ensure link comes out straight from socket

    const pts = [fromPos, ...link.waypoints, toPos];
    let path = `M ${pts[0]!.x} ${pts[0]!.y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;

      // Calculate shoulder point for first segment
      const startX = i === 0 ? p1.x + minOffset : p1.x;
      // Calculate shoulder point for last segment
      const endX = i === pts.length - 2 ? p2.x - minOffset : p2.x;

      if (i === 0) path += ` L ${startX} ${p1.y}`;

      const midX = (startX + endX) / 2;

      if (!isSmooth) {
        path += ` L ${midX} ${p1.y} L ${midX} ${p2.y} L ${endX} ${p2.y}`;
      } else {
        const signX = endX > startX ? 1 : -1;
        const signY = p2.y > p1.y ? 1 : -1;
        const actualBorder = Math.min(
          borderRadius,
          Math.abs(startX - endX) / 2,
          Math.abs(p1.y - p2.y) / 2
        );

        if (actualBorder < 1) {
          path += ` L ${endX} ${p2.y}`;
        } else {
          path += ` L ${midX - actualBorder * signX} ${p1.y} 
                    Q ${midX} ${p1.y} ${midX} ${p1.y + actualBorder * signY}
                    L ${midX} ${p2.y - actualBorder * signY}
                    Q ${midX} ${p2.y} ${midX + actualBorder * signX} ${p2.y}
                    L ${endX} ${p2.y}`;
        }
      }

      if (i === pts.length - 2) path += ` L ${p2.x} ${p2.y}`;
    }
    return path;
  }

  return null;
}

/**
 * Represents a rectangular boundary for spatial indexing and queries.
 */
export class Rect {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number
  ) {}

  /** Returns true if the given point is inside the rectangle. */
  contains(point: Vec2) {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.w &&
      point.y >= this.y &&
      point.y <= this.y + this.h
    );
  }

  /** Returns true if this rectangle intersects with another rectangle. */
  intersects(range: Rect) {
    return !(
      range.x > this.x + this.w ||
      range.x + range.w < this.x ||
      range.y > this.y + this.h ||
      range.y + range.h < this.y
    );
  }
}

/**
 * A QuadTree implementation for high-performance spatial indexing.
 * Used by Anode to perform spatial culling and optimized entity selection.
 */
export class QuadTree<T> {
  private capacity: number = 4;
  private points: { pos: Vec2; data: T }[] = [];
  private divided: boolean = false;

  private northwest: QuadTree<T> | null = null;
  private northeast: QuadTree<T> | null = null;
  private southwest: QuadTree<T> | null = null;
  private southeast: QuadTree<T> | null = null;

  constructor(public boundary: Rect) {}

  /** Internal: Subdivides the node into four quadrants. */
  subdivide() {
    const { x, y, w, h } = this.boundary;

    // Prevent subdivision if dimensions are too small
    if (w < 0.001 || h < 0.001) return;

    const nw = new Rect(x, y, w / 2, h / 2);
    const ne = new Rect(x + w / 2, y, w / 2, h / 2);
    const sw = new Rect(x, y + h / 2, w / 2, h / 2);
    const se = new Rect(x + w / 2, y + h / 2, w / 2, h / 2);

    this.northwest = new QuadTree<T>(nw);
    this.northeast = new QuadTree<T>(ne);
    this.southwest = new QuadTree<T>(sw);
    this.southeast = new QuadTree<T>(se);

    this.divided = true;

    // Distribute points into children
    const oldPoints = this.points;
    this.points = [];
    for (const p of oldPoints) {
      this.insertRecursive(p.pos, p.data);
    }
  }

  /**
   * Inserts a data point. If it's outside the boundary, the tree expands.
   */
  insert(pos: Vec2, data: T): boolean {
    let limit = 0;
    while (!this.boundary.contains(pos) && limit < 100) {
      this.expand(pos);
      limit++;
    }
    return this.insertRecursive(pos, data);
  }

  private insertRecursive(pos: Vec2, data: T): boolean {
    if (!this.boundary.contains(pos)) return false;

    if (!this.divided && this.points.length < this.capacity) {
      this.points.push({ pos, data });
      return true;
    }

    if (!this.divided) {
      this.subdivide();
      // If subdivision failed (too small), just keep the point here
      if (!this.divided) {
        this.points.push({ pos, data });
        return true;
      }
    }

    return (
      this.northwest!.insertRecursive(pos, data) ||
      this.northeast!.insertRecursive(pos, data) ||
      this.southwest!.insertRecursive(pos, data) ||
      this.southeast!.insertRecursive(pos, data)
    );
  }

  /**
   * Removes a data point from the tree.
   * @returns true if the point was found and removed.
   */
  remove(pos: Vec2, data: T): boolean {
    if (!this.boundary.contains(pos)) return false;

    if (!this.divided) {
      const index = this.points.findIndex(
        (p) => p.data === data && p.pos.x === pos.x && p.pos.y === pos.y
      );
      if (index !== -1) {
        this.points.splice(index, 1);
        return true;
      }
      return false;
    }

    const removed =
      this.northwest!.remove(pos, data) ||
      this.northeast!.remove(pos, data) ||
      this.southwest!.remove(pos, data) ||
      this.southeast!.remove(pos, data);

    if (removed) {
      this.tryCollapse();
    }
    return removed;
  }

  /**
   * Moves a point from an old position to a new position.
   */
  move(oldPos: Vec2, newPos: Vec2, data: T): boolean {
    this.remove(oldPos, data);
    return this.insert(newPos, data);
  }

  /** Expands the tree to cover the target point. */
  private expand(target: Vec2) {
    const { x, y, w, h } = this.boundary;
    const isTargetXGreater = target.x >= x + w / 2;
    const isTargetYGreater = target.y >= y + h / 2;

    let newRect: Rect;
    if (!isTargetXGreater && !isTargetYGreater) {
      newRect = new Rect(x - w, y - h, w * 2, h * 2);
    } else if (isTargetXGreater && !isTargetYGreater) {
      newRect = new Rect(x, y - h, w * 2, h * 2);
    } else if (!isTargetXGreater && isTargetYGreater) {
      newRect = new Rect(x - w, y, w * 2, h * 2);
    } else {
      newRect = new Rect(x, y, w * 2, h * 2);
    }

    // Preserve current tree by making it a quadrant of the new tree
    const oldRoot = new QuadTree<T>(this.boundary);
    oldRoot.points = this.points;
    oldRoot.divided = this.divided;
    oldRoot.northwest = this.northwest;
    oldRoot.northeast = this.northeast;
    oldRoot.southwest = this.southwest;
    oldRoot.southeast = this.southeast;

    this.boundary = newRect;
    this.points = [];
    this.divided = true;

    const nw = new Rect(newRect.x, newRect.y, w, h);
    const ne = new Rect(newRect.x + w, newRect.y, w, h);
    const sw = new Rect(newRect.x, newRect.y + h, w, h);
    const se = new Rect(newRect.x + w, newRect.y + h, w, h);

    this.northwest = new QuadTree<T>(nw);
    this.northeast = new QuadTree<T>(ne);
    this.southwest = new QuadTree<T>(sw);
    this.southeast = new QuadTree<T>(se);

    // Re-place the old tree into its new position
    if (nw.x === x && nw.y === y) this.northwest = oldRoot;
    else if (ne.x === x && ne.y === y) this.northeast = oldRoot;
    else if (sw.x === x && sw.y === y) this.southwest = oldRoot;
    else if (se.x === x && se.y === y) this.southeast = oldRoot;
  }

  private tryCollapse() {
    if (!this.divided) return;
    if (
      !this.northwest!.divided &&
      this.northwest!.points.length === 0 &&
      !this.northeast!.divided &&
      this.northeast!.points.length === 0 &&
      !this.southwest!.divided &&
      this.southwest!.points.length === 0 &&
      !this.southeast!.divided &&
      this.southeast!.points.length === 0
    ) {
      this.divided = false;
      this.northwest = null;
      this.northeast = null;
      this.southwest = null;
      this.southeast = null;
    }
  }

  /**
   * Recursively queries the tree for all data points within the given range.
   * @param range The Rect boundary to search within.
   * @param found Optional array to collect results.
   */
  query(range: Rect, found: T[] = []): T[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    for (const p of this.points) {
      if (range.contains(p.pos)) {
        found.push(p.data);
      }
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  /** Clears all points and children from the tree. */
  clear() {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }
}
