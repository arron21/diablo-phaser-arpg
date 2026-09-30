export type TileType =
  | 'EMPTY'
  | 'FLOOR'
  | 'FLOOR_BLOOD'
  | 'WALL'
  | 'DOOR_CLOSED'
  | 'DOOR_OPEN'
  | 'STAIRS_UP'
  | 'STAIRS_DOWN'
  | 'CHEST'
  | 'BARREL'
  | 'SHRINE';

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  isButcherRoom?: boolean;
}

export interface DungeonLevel {
  width: number;
  height: number;
  floorLevel: number;
  tiles: TileType[][];
  rooms: Room[];
  stairsUp: { x: number; y: number };
  stairsDown: { x: number; y: number };
  butcherSpawn?: { x: number; y: number };
  monsterSpawns: { x: number; y: number; type: 'SKELETON_WARRIOR' | 'SKELETON_ARCHER' | 'FALLEN_ONE' }[];
  chests: { x: number; y: number; opened: boolean }[];
  barrels: { x: number; y: number; broken: boolean }[];
  shrines: { x: number; y: number; used: boolean; shrineType: string }[];
}

export class BSPGenerator {
  public static generate(
    floorLevel: number = 1,
    width: number = 54,
    height: number = 54
  ): DungeonLevel {
    // 1. Initialize grid with EMPTY / WALL
    const tiles: TileType[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 'EMPTY' as TileType)
    );

    const rooms: Room[] = [];

    // 2. Binary Space Partitioning
    interface Partition {
      x: number;
      y: number;
      w: number;
      h: number;
      left?: Partition;
      right?: Partition;
      room?: Room;
    }

    const minSize = 9;
    const root: Partition = { x: 2, y: 2, w: width - 4, h: height - 4 };

    function splitPartition(part: Partition, depth: number): void {
      if (depth > 3) return;

      const splitHoriz = Math.random() > 0.5;
      if (splitHoriz) {
        if (part.h >= minSize * 2) {
          const splitY = Math.floor(part.h * (0.35 + Math.random() * 0.3));
          part.left = { x: part.x, y: part.y, w: part.w, h: splitY };
          part.right = { x: part.x, y: part.y + splitY, w: part.w, h: part.h - splitY };
          splitPartition(part.left, depth + 1);
          splitPartition(part.right, depth + 1);
        }
      } else {
        if (part.w >= minSize * 2) {
          const splitX = Math.floor(part.w * (0.35 + Math.random() * 0.3));
          part.left = { x: part.x, y: part.y, w: splitX, h: part.h };
          part.right = { x: part.x + splitX, y: part.y, w: part.w - splitX, h: part.h };
          splitPartition(part.left, depth + 1);
          splitPartition(part.right, depth + 1);
        }
      }
    }

    splitPartition(root, 0);

    // 3. Create rooms in leaf partitions
    function createRooms(part: Partition): void {
      if (part.left && part.right) {
        createRooms(part.left);
        createRooms(part.right);
        // Connect the two partitions
        connectPartitions(part.left, part.right);
      } else {
        // Leaf: carve a room
        const rw = Math.max(5, Math.floor(part.w * (0.6 + Math.random() * 0.25)));
        const rh = Math.max(5, Math.floor(part.h * (0.6 + Math.random() * 0.25)));
        const rx = part.x + Math.floor(Math.random() * (part.w - rw));
        const ry = part.y + Math.floor(Math.random() * (part.h - rh));

        const room: Room = {
          x: rx,
          y: ry,
          width: rw,
          height: rh,
          centerX: Math.floor(rx + rw / 2),
          centerY: Math.floor(ry + rh / 2)
        };

        rooms.push(room);
        part.room = room;

        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            tiles[y][x] = 'FLOOR';
          }
        }
      }
    }

    function getCenter(part: Partition): { x: number; y: number } {
      if (part.room) return { x: part.room.centerX, y: part.room.centerY };
      if (part.left) return getCenter(part.left);
      return { x: Math.floor(part.x + part.w / 2), y: Math.floor(part.y + part.h / 2) };
    }

    function connectPartitions(left: Partition, right: Partition): void {
      const c1 = getCenter(left);
      const c2 = getCenter(right);

      // Carve corridor from c1 to c2
      let cx = c1.x;
      let cy = c1.y;

      while (cx !== c2.x) {
        tiles[cy][cx] = 'FLOOR';
        cx += cx < c2.x ? 1 : -1;
      }
      while (cy !== c2.y) {
        tiles[cy][cx] = 'FLOOR';
        cy += cy < c2.y ? 1 : -1;
      }
    }

    createRooms(root);

    // 4. Place Walls around floors
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (tiles[y][x] === 'EMPTY') {
          // Check if adjacent to floor
          let hasFloorNeighbor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (tiles[y + dy][x + dx] === 'FLOOR') {
                hasFloorNeighbor = true;
                break;
              }
            }
            if (hasFloorNeighbor) break;
          }
          if (hasFloorNeighbor) {
            tiles[y][x] = 'WALL';
          }
        }
      }
    }

    // 5. Place Doors at room corridor thresholds
    for (const room of rooms) {
      // Check top/bottom/left/right boundaries
      const checkCoords = [
        { x: room.centerX, y: room.y - 1 },
        { x: room.centerX, y: room.y + room.height },
        { x: room.x - 1, y: room.centerY },
        { x: room.x + room.width, y: room.centerY }
      ];

      for (const pt of checkCoords) {
        if (pt.x > 0 && pt.x < width - 1 && pt.y > 0 && pt.y < height - 1) {
          if (tiles[pt.y][pt.x] === 'FLOOR') {
            tiles[pt.y][pt.x] = 'DOOR_CLOSED';
          }
        }
      }
    }

    // 6. Stairs Up & Stairs Down
    const entranceRoom = rooms[0];
    const exitRoom = rooms[rooms.length - 1];

    const stairsUp = { x: entranceRoom.centerX, y: entranceRoom.centerY };
    tiles[stairsUp.y][stairsUp.x] = 'STAIRS_UP';

    const stairsDown = { x: exitRoom.centerX, y: exitRoom.centerY };
    tiles[stairsDown.y][stairsDown.x] = 'STAIRS_DOWN';

    // 7. Floor 2 Special: The Butcher's Lair
    let butcherSpawn: { x: number; y: number } | undefined;
    if (floorLevel === 2 && rooms.length >= 2) {
      const butcherRoom = rooms[1];
      butcherRoom.isButcherRoom = true;
      butcherSpawn = { x: butcherRoom.centerX, y: butcherRoom.centerY };

      // Cover room in blood
      for (let y = butcherRoom.y; y < butcherRoom.y + butcherRoom.height; y++) {
        for (let x = butcherRoom.x; x < butcherRoom.x + butcherRoom.width; x++) {
          if (tiles[y][x] === 'FLOOR' && Math.random() < 0.7) {
            tiles[y][x] = 'FLOOR_BLOOD';
          }
        }
      }
    }

    // 8. Monsters, Chests, Barrels, Shrines
    const monsterSpawns: DungeonLevel['monsterSpawns'] = [];
    const chests: DungeonLevel['chests'] = [];
    const barrels: DungeonLevel['barrels'] = [];
    const shrines: DungeonLevel['shrines'] = [];

    const shrineTypes = ['Goat Shrine', 'Cauldron', 'Blood Fountain', 'Abandoned Shrine'];

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (i === 0) continue; // Entrance room is safe

      // Skip normal spawns in Butcher room
      if (room.isButcherRoom) continue;

      // Spawn monsters
      const monsterCount = Math.floor(2 + Math.random() * (3 + floorLevel * 2));
      for (let m = 0; m < monsterCount; m++) {
        const mx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
        if (tiles[my][mx] === 'FLOOR') {
          const typeRoll = Math.random();
          let type: 'SKELETON_WARRIOR' | 'SKELETON_ARCHER' | 'FALLEN_ONE' = 'FALLEN_ONE';
          if (typeRoll < 0.4) type = 'SKELETON_WARRIOR';
          else if (typeRoll < 0.7) type = 'SKELETON_ARCHER';

          monsterSpawns.push({ x: mx, y: my, type });
        }
      }

      // Spawn Chests
      if (Math.random() < 0.45) {
        const cx = room.x + 1;
        const cy = room.y + 1;
        if (tiles[cy][cx] === 'FLOOR') {
          tiles[cy][cx] = 'CHEST';
          chests.push({ x: cx, y: cy, opened: false });
        }
      }

      // Spawn Barrels
      if (Math.random() < 0.6) {
        const bx = room.x + room.width - 2;
        const by = room.y + 1;
        if (tiles[by][bx] === 'FLOOR') {
          tiles[by][bx] = 'BARREL';
          barrels.push({ x: bx, y: by, broken: false });
        }
      }

      // Spawn Shrines
      if (Math.random() < 0.25) {
        const sx = room.centerX;
        const sy = room.centerY;
        if (tiles[sy][sx] === 'FLOOR') {
          tiles[sy][sx] = 'SHRINE';
          const shrineType = shrineTypes[Math.floor(Math.random() * shrineTypes.length)];
          shrines.push({ x: sx, y: sy, used: false, shrineType });
        }
      }
    }

    return {
      width,
      height,
      floorLevel,
      tiles,
      rooms,
      stairsUp,
      stairsDown,
      butcherSpawn,
      monsterSpawns,
      chests,
      barrels,
      shrines
    };
  }
}
