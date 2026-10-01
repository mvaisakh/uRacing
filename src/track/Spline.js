import { Vec2 } from '../math/Vec2.js';

/**
 * CatmullRomSpline: Generates smooth, closed loop curves from discrete control waypoints.
 */
export class CatmullRomSpline {
  constructor(points = [], isClosed = true) {
    this.points = points.map(p => new Vec2(p.x, p.y));
    this.isClosed = isClosed;
  }

  /**
   * Evaluates point on spline at parameter t (0.0 to points.length)
   */
  getPoint(t) {
    const p = this.points;
    const count = p.length;
    if (count < 3) return p[0] ? p[0].clone() : new Vec2();

    const i = Math.floor(t);
    const u = t - i;

    const p0 = p[this._wrap(i - 1, count)];
    const p1 = p[this._wrap(i, count)];
    const p2 = p[this._wrap(i + 1, count)];
    const p3 = p[this._wrap(i + 2, count)];

    const u2 = u * u;
    const u3 = u2 * u;

    // Standard Catmull-Rom cubic basis
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * u +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
    );

    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * u +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
    );

    return new Vec2(x, y);
  }

  /**
   * First derivative for tangent direction
   */
  getTangent(t) {
    const delta = 0.005;
    const pA = this.getPoint(t - delta);
    const pB = this.getPoint(t + delta);
    return pB.sub(pA).normalize();
  }

  /**
   * Normal perpendicular vector
   */
  getNormal(t) {
    const tangent = this.getTangent(t);
    return new Vec2(-tangent.y, tangent.x);
  }

  _wrap(i, count) {
    if (!this.isClosed) {
      return Math.max(0, Math.min(count - 1, i));
    }
    return (i % count + count) % count;
  }

  /**
   * Generates equidistant sample points along entire loop
   */
  sampleEvenly(samplesPerSegment = 10) {
    const totalSamples = this.points.length * samplesPerSegment;
    const samples = [];

    for (let i = 0; i < totalSamples; i++) {
      const t = (i / totalSamples) * this.points.length;
      const pt = this.getPoint(t);
      const tangent = this.getTangent(t);
      const normal = new Vec2(-tangent.y, tangent.x);

      samples.push({
        t,
        point: pt,
        tangent,
        normal
      });
    }
    return samples;
  }
}
