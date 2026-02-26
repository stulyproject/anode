import { Context } from './context';
import { Link, Vec2, LinkKind } from './elements';

export function getLinkPath(ctx: Context, link: Link): string | null {
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

  const fromPos = new Vec2(
    fromWorldPos.x + fromSocket.offset.x,
    fromWorldPos.y + fromSocket.offset.y
  );

  const toPos = new Vec2(toWorldPos.x + toSocket.offset.x, toWorldPos.y + toSocket.offset.y);

  if (link.kind === LinkKind.LINE) {
    return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
  }

  if (link.kind === LinkKind.BEZIER) {
    const dx = Math.abs(fromPos.x - toPos.x);
    const offset = Math.max(dx / 2, 50);
    return `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + offset} ${fromPos.y}, ${toPos.x - offset} ${toPos.y}, ${toPos.x} ${toPos.y}`;
  }

  if (link.kind === LinkKind.STEP || link.kind === LinkKind.SMOOTH_STEP) {
    const midX = (fromPos.x + toPos.x) / 2;
    if (link.kind === LinkKind.STEP) {
      return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
    }
    const borderRadius = 10;
    const signX = toPos.x > fromPos.x ? 1 : -1;
    const signY = toPos.y > fromPos.y ? 1 : -1;

    return `M ${fromPos.x} ${fromPos.y} 
            L ${midX - borderRadius * signX} ${fromPos.y} 
            Q ${midX} ${fromPos.y} ${midX} ${fromPos.y + borderRadius * signY}
            L ${midX} ${toPos.y - borderRadius * signY}
            Q ${midX} ${toPos.y} ${midX + borderRadius * signX} ${toPos.y}
            L ${toPos.x} ${toPos.y}`;
  }

  return null;
}

export class Rect {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number
  ) {}

  contains(point: Vec2) {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.w &&
      point.y >= this.y &&
      point.y <= this.y + this.h
    );
  }

  intersects(range: Rect) {
    return !(
      range.x > this.x + this.w ||
      range.x + range.w < this.x ||
      range.y > this.y + this.h ||
      range.y + range.h < this.y
    );
  }
}

export class QuadTree<T> {
  private capacity: number = 4;
  private points: { pos: Vec2; data: T }[] = [];
  private divided: boolean = false;

  private northwest: QuadTree<T> | null = null;
  private northeast: QuadTree<T> | null = null;
  private southwest: QuadTree<T> | null = null;
  private southeast: QuadTree<T> | null = null;

  constructor(public boundary: Rect) {}

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const nw = new Rect(x, y, w / 2, h / 2);
    const ne = new Rect(x + w / 2, y, w / 2, h / 2);
    const sw = new Rect(x, y + h / 2, w / 2, h / 2);
    const se = new Rect(x + w / 2, y + h / 2, w / 2, h / 2);

    this.northwest = new QuadTree<T>(nw);
    this.northeast = new QuadTree<T>(ne);
    this.southwest = new QuadTree<T>(sw);
    this.southeast = new QuadTree<T>(se);

    this.divided = true;
  }

  insert(pos: Vec2, data: T): boolean {
    if (!this.boundary.contains(pos)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push({ pos, data });
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northwest!.insert(pos, data) ||
      this.northeast!.insert(pos, data) ||
      this.southwest!.insert(pos, data) ||
      this.southeast!.insert(pos, data)
    );
  }

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

  clear() {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }
}
