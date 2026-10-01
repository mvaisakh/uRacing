import { Vec2 } from '../math/Vec2.js';

/**
 * Camera2D: Smooth follow camera with speed lookahead and viewport clipping.
 */
export class Camera2D {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.position = new Vec2();
    this.target = new Vec2();
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Follow smoothing factors (lerp)
    this.smoothSpeed = 6.0;
    this.lookaheadDist = 0.22; // Look forward based on velocity
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(targetPos, targetVelocity, dt) {
    // Lead the camera slightly forward in the direction of travel
    const lookahead = targetVelocity.clone().scale(this.lookaheadDist);
    this.target.copy(targetPos).add(lookahead);

    // Zoom out slightly at higher speeds for wider situational view
    const speed = targetVelocity.length();
    this.targetZoom = Math.max(0.85, 1.15 - (speed / 700) * 0.35);

    // Exponential smoothing
    const t = 1 - Math.exp(-this.smoothSpeed * dt);
    this.position.x += (this.target.x - this.position.x) * t;
    this.position.y += (this.target.y - this.position.y) * t;
    this.zoom += (this.targetZoom - this.zoom) * t;
  }

  begin(ctx) {
    ctx.save();
    // Center of screen
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.position.x, -this.position.y);
  }

  end(ctx) {
    ctx.restore();
  }

  screenToWorld(screenX, screenY) {
    const centeredX = screenX - this.viewportWidth / 2;
    const centeredY = screenY - this.viewportHeight / 2;
    return new Vec2(
      this.position.x + centeredX / this.zoom,
      this.position.y + centeredY / this.zoom
    );
  }
}
