/**
 * Isometric projection math for 2:1 dimetric grid (Diablo 1 standard)
 */
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const HALF_TILE_W = TILE_WIDTH / 2; // 32
export const HALF_TILE_H = TILE_HEIGHT / 2; // 16

export interface Point2D {
  x: number;
  y: number;
}

export class Isometric {
  /**
   * Convert grid (x, y) coordinates to screen pixel (x, y) coordinates
   */
  public static gridToScreen(gx: number, gy: number): Point2D {
    return {
      x: (gx - gy) * HALF_TILE_W,
      y: (gx + gy) * HALF_TILE_H
    };
  }

  /**
   * Convert screen pixel (x, y) coordinates to continuous grid (x, y) coordinates
   */
  public static screenToGrid(sx: number, sy: number): Point2D {
    const normX = sx / HALF_TILE_W;
    const normY = sy / HALF_TILE_H;
    return {
      x: (normX + normY) / 2,
      y: (normY - normX) / 2
    };
  }

  /**
   * Convert screen pixel (x, y) coordinates to discrete integer tile (x, y)
   */
  public static screenToTile(sx: number, sy: number): Point2D {
    const grid = this.screenToGrid(sx, sy);
    return {
      x: Math.floor(grid.x),
      y: Math.floor(grid.y)
    };
  }

  /**
   * Calculate render depth for isometric sorting
   * Objects with higher (gx + gy) are closer to the camera and rendered in front
   */
  public static calculateDepth(gx: number, gy: number, layerOffset: number = 0): number {
    return (gx + gy) * 100 + layerOffset;
  }

  /**
   * Euclidean distance in grid space
   */
  public static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Chebyshev distance (grid steps including diagonals)
   */
  public static chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  }

  /**
   * Manhattan distance
   */
  public static manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }
}
