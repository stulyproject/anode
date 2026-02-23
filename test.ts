import { Context, SocketKind } from './src/anode';

const ctx = new Context<{ label: string }>();

// 1 - Listeners
ctx.registerEntityCreateListener((e) => console.log('Entity created:', e.inner.label));
ctx.registerLinkCreateListener((l) =>
  console.log('Link created between sockets:', l.from, '->', l.to)
);
ctx.registerEntityMoveListener((e, pos) => console.log(`Entity ${e.id} moved to`, pos));

// 2 - Entities and Sockets
const nodeA = ctx.newEntity({ label: 'Source' });
const outA = ctx.newSocket(nodeA, SocketKind.OUTPUT, 'Value');

const nodeB = ctx.newEntity({ label: 'Sink' });
const inB = ctx.newSocket(nodeB, SocketKind.INPUT, 'Value');

// 3 - Linking
ctx.newLink(outA, inB);

// 4 - Grouping
const group = ctx.newGroup('My Group');
group.add(nodeA.id);
group.add(nodeB.id);

console.log('=== Moving group');
ctx.moveGroup(group, 10, 20);

// 5 - Serialization
console.log('=== Serialization');
const data = ctx.toJSON();
console.log(JSON.stringify(data, null, 2));

// 6 - Deserialization
console.log('=== Deserialization');
const newCtx = new Context();
newCtx.fromJSON(data);
console.log('New Context Entities count:', newCtx.entities.size);
console.log('New Context Links count:', newCtx.links.size);
