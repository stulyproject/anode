export type Vec2 = { x: number; y: number };

export class Atom {
  pos: Vec2 = { x: 0, y: 0 };
}

export type Rect = {
  width: Vec2;
  height: Vec2;
};

export class World {
  bouderies: Rect = {
    width: { x: 0, y: 0 },
    height: { x: 0, y: 0 },
  };
}
