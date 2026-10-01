import { Vec2 } from '../math/Vec2.js';

/**
 * AIController: Pure pursuit waypoint follower with corner apex deceleration.
 */
export class AIController {
  constructor(car, splineSamples, offsetLane = 0) {
    this.car = car;
    this.samples = splineSamples;
    this.offsetLane = offsetLane; // -1 to 1 across track width
    this.currentSampleIndex = 0;
    this.lookaheadSteps = 8; // Number of spline points forward
  }

  update(dt, difficultyMultiplier = 1.0) {
    const pos = this.car.body.position;

    // 1. Locate nearest spline point
    let closestDist = Infinity;
    let closestIndex = this.currentSampleIndex;
    const searchWindow = 20;
    const n = this.samples.length;

    for (let offset = -5; offset < searchWindow; offset++) {
      const idx = (this.currentSampleIndex + offset + n) % n;
      const d = pos.distanceTo(this.samples[idx].point);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = idx;
      }
    }
    this.currentSampleIndex = closestIndex;

    // 2. Select lookahead target point
    const targetIdx = (this.currentSampleIndex + this.lookaheadSteps) % n;
    const targetSample = this.samples[targetIdx];
    const targetPoint = targetSample.point.clone().add(
      targetSample.normal.clone().scale(this.offsetLane * 25)
    );

    // 3. Compute steering angle towards target
    const toTarget = targetPoint.clone().sub(pos);
    const desiredHeading = toTarget.angle();
    const currentHeading = this.car.body.angle;

    // Calculate signed angular difference normalized to [-PI, PI]
    let diff = desiredHeading - currentHeading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const steer = Math.max(-1, Math.min(1, diff * 2.2));

    // 4. Throttle / Braking logic based on upcoming corner sharpness
    const turnSeverity = Math.abs(diff);
    let throttle = 1.0;
    let brake = 0.0;

    if (turnSeverity > 0.65) {
      // Approaching sharp curve: brake to avoid sliding out
      throttle = 0.35 * difficultyMultiplier;
      if (this.car.forwardVelocity > 250) {
        brake = 0.6;
      }
    } else {
      throttle = 1.0 * difficultyMultiplier;
    }

    return {
      throttle,
      brake,
      steer,
      handbrake: turnSeverity > 1.2 && this.car.forwardVelocity > 220,
      reset: false
    };
  }
}
