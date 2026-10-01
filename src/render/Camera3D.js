import { Vec2 } from '../math/Vec2.js';

/**
 * Camera3D: Third-person chase camera with perspective projection, elevation tilt,
 * rotational lag (spring damping), and speed lookahead.
 */
export class Camera3D {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.position = new Vec2();
    // Fixed isometric zoom and angles
    this.fovScale = 1.6;
    this.pitch = 0.6; // Isometric squash
    
    this.smoothPos = 12.0;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(targetPos, targetAngle, targetVelocity, dt) {
    // Smooth position follow (no rotation tracking to prevent nausea)
    const posT = 1 - Math.exp(-this.smoothPos * dt);
    this.position.x += (targetPos.x - this.position.x) * posT;
    this.position.y += (targetPos.y - this.position.y) * posT;
    
    // Zoom out slightly at speed
    const speed = targetVelocity.length();
    const targetFov = Math.max(1.3, 1.8 - (speed / 800) * 0.4);
    this.fovScale += (targetFov - this.fovScale) * 5.0 * dt;
  }

  begin(ctx) {
    ctx.save();
    // Center point
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);

    // Apply isometric tilt and fixed 45-degree rotation
    ctx.scale(this.fovScale, this.fovScale * this.pitch);
    // Fixed isometric angle (Math.PI / 4 = 45 degrees)
    ctx.rotate(-Math.PI / 4);

    // Translate to camera focus point
    ctx.translate(-this.position.x, -this.position.y);
  }

  end(ctx) {
    ctx.restore();
  }
}
