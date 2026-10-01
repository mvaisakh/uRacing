import { Vec2 } from '../math/Vec2.js';

/**
 * Minimap: Renders miniature wireframe circuit in bottom right corner with vehicle blips.
 */
export class Minimap {
  constructor(samples, size = 180, padding = 15) {
    this.samples = samples;
    this.size = size;
    this.padding = padding;

    this._computeBounds();
  }

  _computeBounds() {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const s of this.samples) {
      if (s.point.x < minX) minX = s.point.x;
      if (s.point.x > maxX) maxX = s.point.x;
      if (s.point.y < minY) minY = s.point.y;
      if (s.point.y > maxY) maxY = s.point.y;
    }

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.trackWidth = maxX - minX;
    this.trackHeight = maxY - minY;

    const availableSize = this.size - this.padding * 2;
    this.scale = Math.min(availableSize / this.trackWidth, availableSize / this.trackHeight);
  }

  worldToMap(pos) {
    const x = this.padding + (pos.x - this.minX) * this.scale;
    const y = this.padding + (pos.y - this.minY) * this.scale;
    return new Vec2(x, y);
  }

  render(ctx, screenX, screenY, playerCar, aiCars = []) {
    ctx.save();
    ctx.translate(screenX, screenY);

    // Background semi-transparent radar box
    ctx.fillStyle = 'rgba(12, 16, 22, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.fillRect(0, 0, this.size, this.size);
    ctx.strokeRect(0, 0, this.size, this.size);

    // Track path outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const first = this.worldToMap(this.samples[0].point);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < this.samples.length; i++) {
      const pt = this.worldToMap(this.samples[i].point);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.stroke();

    // AI Vehicles blips (Red dots)
    for (const ai of aiCars) {
      const aiMapPos = this.worldToMap(ai.body.position);
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(aiMapPos.x, aiMapPos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player vehicle blip (Cyan dot with glow)
    const pMapPos = this.worldToMap(playerCar.body.position);
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(pMapPos.x, pMapPos.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
