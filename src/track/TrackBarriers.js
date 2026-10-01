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
    // Render barrier rails (micro plastic snap-on toy guard rails)
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 4;
    for (const b of this.barriers) {
      ctx.beginPath();
      ctx.moveTo(b.p1.x, b.p1.y);
      ctx.lineTo(b.p2.x, b.p2.y);
      ctx.stroke();
    }
  }
}
