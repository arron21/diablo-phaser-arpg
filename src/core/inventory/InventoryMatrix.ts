import { ItemData } from '../items/ItemTypes';

export interface GridPos {
  col: number;
  row: number;
}

export interface PlacedItem {
  item: ItemData;
  col: number;
  row: number;
}

export class InventoryMatrix {
  public readonly cols: number = 10;
  public readonly rows: number = 4;
  // cells[row][col] points to the PlacedItem occupying it, or null
  private grid: (PlacedItem | null)[][];
  private items: PlacedItem[] = [];

  constructor(cols: number = 10, rows: number = 4) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
  }

  public getAllItems(): PlacedItem[] {
    return [...this.items];
  }

  public getItemAt(col: number, row: number): PlacedItem | null {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }
    return this.grid[row][col];
  }

  public canPlaceItem(item: ItemData, col: number, row: number, ignoreItem?: ItemData): boolean {
    if (col < 0 || row < 0) return false;
    if (col + item.width > this.cols || row + item.height > this.rows) {
      return false;
    }

    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        const occupant = this.grid[r][c];
        if (occupant !== null) {
          if (ignoreItem && occupant.item.id === ignoreItem.id) {
            continue;
          }
          return false;
        }
      }
    }

    return true;
  }

  public placeItem(item: ItemData, col: number, row: number): boolean {
    if (!this.canPlaceItem(item, col, row)) {
      return false;
    }

    // Remove if already placed in grid
    this.removeItem(item);

    const placed: PlacedItem = { item, col, row };
    this.items.push(placed);

    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        this.grid[r][c] = placed;
      }
    }

    return true;
  }

  public removeItem(item: ItemData): PlacedItem | null {
    const idx = this.items.findIndex(p => p.item.id === item.id);
    if (idx === -1) return null;

    const placed = this.items[idx];
    this.items.splice(idx, 1);

    for (let r = placed.row; r < placed.row + placed.item.height; r++) {
      for (let c = placed.col; c < placed.col + placed.item.width; c++) {
        if (this.grid[r][c]?.item.id === item.id) {
          this.grid[r][c] = null;
        }
      }
    }

    return placed;
  }

  public autoPlaceItem(item: ItemData): GridPos | null {
    // Scan left-to-right, top-to-bottom
    for (let r = 0; r <= this.rows - item.height; r++) {
      for (let c = 0; c <= this.cols - item.width; c++) {
        if (this.canPlaceItem(item, c, r)) {
          this.placeItem(item, c, r);
          return { col: c, row: r };
        }
      }
    }
    return null;
  }

  public clear(): void {
    this.items = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = null;
      }
    }
  }
}
