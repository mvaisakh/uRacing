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
    this.angle = 0; // Camera yaw orientation
    this.targetAngle = 0;

    // Camera chase distances
    this.chaseDistance = 140; // Behind the vehicle
    this.elevation = 75;      // Height above the track surface
    this.pitch = 0.58;        // Perspective squashing pitch (pseudo-3D angle)
    this.fovScale = 1.0;

    this.smoothPos = 8.0;
    this.smoothRot = 6.0;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(targetPos, targetAngle, targetVelocity, dt) {
    this.targetAngle = targetAngle;

    // Angular smooth follow with shortest arc wrapping
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const rotT = 1 - Math.exp(-this.smoothRot * dt);
    this.angle += diff * rotT;

    // Follow position (anchored behind vehicle)
    const posT = 1 - Math.exp(-this.smoothPos * dt);
    this.position.x += (targetPos.x - this.position.x) * posT;
    this.position.y += (targetPos.y - this.position.y) * posT;

    // Dynamic FOV / distance based on vehicle forward velocity
    const speed = targetVelocity.length();
    this.fovScale = Math.max(0.85, 1.05 - (speed / 800) * 0.25);
  }

  /**
   * Sets up 3D perspective camera matrix on the 2D canvas:
   * 1. Translates center to screen bottom-center.
   * 2. Scales for perspective foreshortening (pitch).
   * 3. Rotates world so heading is UP.
   * 4. Translates camera focal point with chase offset.
   */
  begin(ctx) {
    ctx.save();
    // Center point shifted slightly down to allow view of the horizon ahead
    ctx.translate(this.viewportWidth / 2, this.viewportHeight * 0.62);

    // Apply 3D perspective tilt (pitch down looking forward)
    ctx.scale(this.fovScale, this.fovScale * this.pitch);

    // Rotate world so vehicle is facing upward (+Y forward)
    // Vehicle heading angle is 0 along +X, so we rotate -angle - PI/2
    ctx.rotate(-this.angle - Math.PI / 2);

    // Anchor camera behind the car
    const heading = Vec2.fromAngle(this.angle);
    const cameraEye = this.position.clone().sub(heading.clone().scale(this.chaseDistance));
    ctx.translate(-cameraEye.x, -cameraEye.y);
  }

  end(ctx) {
    ctx.restore();
  }
}
