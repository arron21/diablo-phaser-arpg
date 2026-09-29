export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: PathNode;
}

export class Pathfinding {
  /**
   * 8-directional A* search
   */
  public static findPath(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    isWalkable: (x: number, y: number) => boolean,
    maxDistance: number = 30
  ): { x: number; y: number }[] {
    if (startX === targetX && startY === targetY) {
      return [];
    }

    if (!isWalkable(targetX, targetY)) {
      // Find closest adjacent walkable neighbor
      const neighbors = this.getNeighbors(targetX, targetY);
      let bestDist = Infinity;
      let altTarget: { x: number; y: number } | null = null;
      for (const n of neighbors) {
        if (isWalkable(n.x, n.y)) {
          const d = Math.abs(n.x - startX) + Math.abs(n.y - startY);
          if (d < bestDist) {
            bestDist = d;
            altTarget = n;
          }
        }
      }
      if (!altTarget) return [];
      targetX = altTarget.x;
      targetY = altTarget.y;
    }

    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, targetX, targetY),
      f: this.heuristic(startX, startY, targetX, targetY)
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Pick lowest f node
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const key = `${current.x},${current.y}`;

      if (current.x === targetX && current.y === targetY) {
        return this.reconstructPath(current);
      }

      closedSet.add(key);

      const neighbors = this.getNeighbors(current.x, current.y);
      for (const n of neighbors) {
        const nKey = `${n.x},${n.y}`;
        if (closedSet.has(nKey)) continue;

        if (!isWalkable(n.x, n.y)) continue;

        // Prevent diagonal corner cutting
        const dx = n.x - current.x;
        const dy = n.y - current.y;
        if (dx !== 0 && dy !== 0) {
          if (!isWalkable(current.x + dx, current.y) || !isWalkable(current.x, current.y + dy)) {
            continue;
          }
        }

        const stepCost = dx !== 0 && dy !== 0 ? 1.414 : 1.0;
        const tentativeG = current.g + stepCost;

        if (tentativeG > maxDistance) continue;

        const existing = openSet.find(node => node.x === n.x && node.y === n.y);
        if (!existing) {
          const h = this.heuristic(n.x, n.y, targetX, targetY);
          openSet.push({
            x: n.x,
            y: n.y,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current
          });
        } else if (tentativeG < existing.g) {
          existing.g = tentativeG;
          existing.f = tentativeG + existing.h;
          existing.parent = current;
        }
      }
    }

    return [];
  }

  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  }

  private static getNeighbors(x: number, y: number): { x: number; y: number }[] {
    return [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
      { x: x + 1, y: y + 1 },
      { x: x - 1, y: y + 1 },
      { x: x + 1, y: y - 1 },
      { x: x - 1, y: y - 1 }
    ];
  }

  private static reconstructPath(node: PathNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let curr: PathNode | undefined = node;
    while (curr && curr.parent) {
      path.unshift({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    return path;
  }
}
