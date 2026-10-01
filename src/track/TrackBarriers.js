import { Barrier } from '../physics/CollisionSystem.js';

/**
 * TrackBarriers: Converts ribbon outer and inner boundary vertices into collision segments.
 */
export class TrackBarriers {
  constructor(trackRibbon) {
    this.barriers = [];
    this._build(trackRibbon);
  }

  _build(trackRibbon) {
    const { innerBoundaries, outerBoundaries } = trackRibbon;
    const n = innerBoundaries.length;

    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;

      // Outer barrier segments (cars bounce off outer wall)
      this.barriers.push(new Barrier(outerBoundaries[i], outerBoundaries[next], 0.35));

      // Inner barrier segments (cars bounce off inner wall)
      this.barriers.push(new Barrier(innerBoundaries[next], innerBoundaries[i], 0.35));
    }
  }

  getBarriers() {
    return this.barriers;
  }

  render(ctx) {
    // 1. Guard Rail Ground Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 4;
    for (const b of this.barriers) {
      ctx.beginPath();
      ctx.moveTo(b.p1.x + 4, b.p1.y + 6);
      ctx.lineTo(b.p2.x + 4, b.p2.y + 6);
      ctx.stroke();
    }

    // 2. Upright Stanchion Posts (Micro Toy Rail Supports)
    ctx.fillStyle = '#7f8c8d';
    for (let i = 0; i < this.barriers.length; i += 2) {
      const b = this.barriers[i];
      ctx.fillRect(b.p1.x - 2, b.p1.y - 7, 4, 7);
    }

    // 3. Elevated Top Rail (3D extruded barrier beam)
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3.5;
    for (const b of this.barriers) {
      ctx.beginPath();
      ctx.moveTo(b.p1.x, b.p1.y - 7);
      ctx.lineTo(b.p2.x, b.p2.y - 7);
      ctx.stroke();
    }

    // Specular highlight line along rail top
    ctx.strokeStyle = '#ff7675';
    ctx.lineWidth = 1.5;
    for (const b of this.barriers) {
      ctx.beginPath();
      ctx.moveTo(b.p1.x, b.p1.y - 8);
      ctx.lineTo(b.p2.x, b.p2.y - 8);
      ctx.stroke();
    }
  }
}
