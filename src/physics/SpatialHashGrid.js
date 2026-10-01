/**
 * SpatialHashGrid: Subdivides track barriers and static props into 2D grid buckets
 * to reduce collision detection complexity from O(N) to O(1) for locked 60fps.
 */
export class SpatialHashGrid {
  constructor(cellSize = 120) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _hash(cellX, cellY) {
    return `${cellX}_${cellY}`;
  }

  insertBarrier(barrier) {
    const minX = Math.min(barrier.p1.x, barrier.p2.x);
    const maxX = Math.max(barrier.p1.x, barrier.p2.x);
    const minY = Math.min(barrier.p1.y, barrier.p2.y);
    const maxY = Math.max(barrier.p1.y, barrier.p2.y);

    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const key = this._hash(cx, cy);
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key).push(barrier);
      }
    }
  }

  queryNearby(pos, radius = 50) {
    const startCellX = Math.floor((pos.x - radius) / this.cellSize);
    const endCellX = Math.floor((pos.x + radius) / this.cellSize);
    const startCellY = Math.floor((pos.y - radius) / this.cellSize);
    const endCellY = Math.floor((pos.y + radius) / this.cellSize);

    const candidates = new Set();
    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const list = this.cells.get(this._hash(cx, cy));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            candidates.add(list[i]);
          }
        }
      }
    }
    return candidates;
  }
}
