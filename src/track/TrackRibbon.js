import { Vec2 } from '../math/Vec2.js';

/**
 * TrackRibbon: Generates 2D track boundary ribbons, curbs, centerlines, and asphalt strips.
 */
export class TrackRibbon {
  constructor(samples, trackWidth = 140) {
    this.samples = samples;
    this.trackWidth = trackWidth;
    this.halfWidth = trackWidth / 2;

    this.innerBoundaries = [];
    this.outerBoundaries = [];
    this.centerLine = [];

    this._generateBoundaries();
  }

  _generateBoundaries() {
    const curbExtra = 8;
    for (const s of this.samples) {
      const p = s.point;
      const n = s.normal;

      // Outer and inner edges
      const outer = p.clone().add(n.clone().scale(this.halfWidth));
      const inner = p.clone().sub(n.clone().scale(this.halfWidth));

      this.outerBoundaries.push(outer);
      this.innerBoundaries.push(inner);
      this.centerLine.push(p);
    }
  }

  render(ctx) {
    const n = this.samples.length;
    if (n < 2) return;

    // 1. Draw Asphalt Road Surface
    ctx.fillStyle = '#222731';
    ctx.beginPath();
    ctx.moveTo(this.outerBoundaries[0].x, this.outerBoundaries[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(this.outerBoundaries[i].x, this.outerBoundaries[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Cut out the inner infield to create the ribbon
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(this.innerBoundaries[0].x, this.innerBoundaries[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(this.innerBoundaries[i].x, this.innerBoundaries[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Fill back asphalt base inside ribbon segments
    ctx.save();
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      ctx.fillStyle = '#272d38';
      ctx.beginPath();
      ctx.moveTo(this.innerBoundaries[i].x, this.innerBoundaries[i].y);
      ctx.lineTo(this.outerBoundaries[i].x, this.outerBoundaries[i].y);
      ctx.lineTo(this.outerBoundaries[next].x, this.outerBoundaries[next].y);
      ctx.lineTo(this.innerBoundaries[next].x, this.innerBoundaries[next].y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Red & White Racing Curbs on outer & inner edges
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const isRed = Math.floor(i / 3) % 2 === 0;
      ctx.fillStyle = isRed ? '#e74c3c' : '#ecf0f1';

      // Outer curb
      const oEdge1 = this.outerBoundaries[i];
      const oEdge2 = this.outerBoundaries[next];
      const oNorm1 = this.samples[i].normal;
      const oNorm2 = this.samples[next].normal;
      const oCurb1 = oEdge1.clone().add(oNorm1.clone().scale(6));
      const oCurb2 = oEdge2.clone().add(oNorm2.clone().scale(6));

      ctx.beginPath();
      ctx.moveTo(oEdge1.x, oEdge1.y);
      ctx.lineTo(oCurb1.x, oCurb1.y);
      ctx.lineTo(oCurb2.x, oCurb2.y);
      ctx.lineTo(oEdge2.x, oEdge2.y);
      ctx.closePath();
      ctx.fill();

      // Inner curb
      const iEdge1 = this.innerBoundaries[i];
      const iEdge2 = this.innerBoundaries[next];
      const iCurb1 = iEdge1.clone().sub(oNorm1.clone().scale(6));
      const iCurb2 = iEdge2.clone().sub(oNorm2.clone().scale(6));

      ctx.beginPath();
      ctx.moveTo(iEdge1.x, iEdge1.y);
      ctx.lineTo(iCurb1.x, iCurb1.y);
      ctx.lineTo(iCurb2.x, iCurb2.y);
      ctx.lineTo(iEdge2.x, iEdge2.y);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Dashed White Center Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(this.centerLine[0].x, this.centerLine[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(this.centerLine[i].x, this.centerLine[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 4. Start/Finish Chequered Line
    this._drawStartFinishLine(ctx);
  }

  _drawStartFinishLine(ctx) {
    const p = this.centerLine[0];
    const n = this.samples[0].normal;
    const inner = p.clone().sub(n.clone().scale(this.halfWidth));
    const outer = p.clone().add(n.clone().scale(this.halfWidth));

    const steps = 10;
    const vec = outer.clone().sub(inner);
    const forward = this.samples[0].tangent.clone().scale(6);

    for (let i = 0; i < steps; i++) {
      const t1 = i / steps;
      const t2 = (i + 1) / steps;
      const p1 = inner.clone().add(vec.clone().scale(t1));
      const p2 = inner.clone().add(vec.clone().scale(t2));

      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#111111';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p2.x + forward.x, p2.y + forward.y);
      ctx.lineTo(p1.x + forward.x, p1.y + forward.y);
      ctx.closePath();
      ctx.fill();

      // Second row
      ctx.fillStyle = i % 2 !== 0 ? '#ffffff' : '#111111';
      ctx.beginPath();
      ctx.moveTo(p1.x + forward.x, p1.y + forward.y);
      ctx.lineTo(p2.x + forward.x, p2.y + forward.y);
      ctx.lineTo(p2.x + forward.x * 2, p2.y + forward.y * 2);
      ctx.lineTo(p1.x + forward.x * 2, p1.y + forward.y * 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}
