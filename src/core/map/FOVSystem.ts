export type VisibilityState = 'UNSEEN' | 'EXPLORED' | 'VISIBLE';

export interface LightTile {
  state: VisibilityState;
  intensity: number; // 0.0 (dark) to 1.0 (bright)
}

export class FOVSystem {
  public width: number;
  public height: number;
  public lightRadius: number = 9;

  // Grid of light states
  public lightMap: LightTile[][];

  constructor(width: number, height: number, lightRadius: number = 9) {
    this.width = width;
    this.height = height;
    this.lightRadius = lightRadius;
    this.lightMap = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({
        state: 'UNSEEN' as VisibilityState,
        intensity: 0
      }))
    );
  }

  /**
   * Recalculates field of view from (centerX, centerY)
   * isOpaque: returns true if tile blocks light (e.g. WALL, DOOR_CLOSED)
   */
  public compute(
    centerX: number,
    centerY: number,
    isOpaque: (x: number, y: number) => boolean
  ): void {
    // 1. Demote previous VISIBLE tiles to EXPLORED
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.lightMap[y][x].state === 'VISIBLE') {
          this.lightMap[y][x].state = 'EXPLORED';
          this.lightMap[y][x].intensity = 0.25; // Dim fog of war
        }
      }
    }

    // 2. Mark player tile visible
    if (this.inBounds(centerX, centerY)) {
      this.lightMap[centerY][centerX].state = 'VISIBLE';
      this.lightMap[centerY][centerX].intensity = 1.0;
    }

    // 3. Raycast 360 degrees
    const rays = 180;
    const stepSize = 0.4;
    const maxSteps = Math.ceil(this.lightRadius / stepSize);

    for (let r = 0; r < rays; r++) {
      const angle = (r * Math.PI * 2) / rays;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      let currX = centerX + 0.5;
      let currY = centerY + 0.5;

      for (let s = 1; s <= maxSteps; s++) {
        currX += cos * stepSize;
        currY += sin * stepSize;

        const tx = Math.floor(currX);
        const ty = Math.floor(currY);

        if (!this.inBounds(tx, ty)) break;

        const dist = Math.sqrt((tx - centerX) ** 2 + (ty - centerY) ** 2);
        if (dist > this.lightRadius) break;

        // Quadratic light falloff
        const falloff = 1 - Math.pow(dist / this.lightRadius, 1.8);
        const intensity = Math.max(0.2, Math.min(1.0, falloff));

        this.lightMap[ty][tx].state = 'VISIBLE';
        this.lightMap[ty][tx].intensity = Math.max(this.lightMap[ty][tx].intensity, intensity);

        // If tile blocks light, light illuminates the wall face, then stops
        if (isOpaque(tx, ty)) {
          break;
        }
      }
    }
  }

  public isVisible(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.lightMap[y][x].state === 'VISIBLE';
  }

  public isExplored(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.lightMap[y][x].state !== 'UNSEEN';
  }

  public getIntensity(x: number, y: number): number {
    if (!this.inBounds(x, y)) return 0;
    return this.lightMap[y][x].intensity;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
