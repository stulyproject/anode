import { Context } from './context';
import { Link, Vec2 } from './elements';

export interface Path {
  from: Vec2;
  to: Vec2;
  control1: Vec2;
  control2: Vec2;
}

export function getLinkPath(ctx: Context, link: Link): Path | null {
  const fromSocket = ctx.sockets.get(link.from);
  const toSocket = ctx.sockets.get(link.to);

  if (!fromSocket || !toSocket) return null;

  const fromEntity = ctx.entities.get(fromSocket.entityId);
  const toEntity = ctx.entities.get(toSocket.entityId);

  if (!fromEntity || !toEntity) return null;

  const fromPos = new Vec2(
    fromEntity.position.x + fromSocket.offset.x,
    fromEntity.position.y + fromSocket.offset.y
  );

  const toPos = new Vec2(
    toEntity.position.x + toSocket.offset.x,
    toEntity.position.y + toSocket.offset.y
  );

  const dx = Math.abs(fromPos.x - toPos.x);
  const offset = Math.max(dx / 2, 50);

  return {
    from: fromPos,
    to: toPos,
    control1: new Vec2(fromPos.x + offset, fromPos.y),
    control2: new Vec2(toPos.x - offset, toPos.y)
  };
}
