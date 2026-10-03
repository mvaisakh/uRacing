import { Vec2 } from '../math/Vec2.js';

/**
 * AIController: Pure pursuit waypoint follower with corner apex deceleration,
 * obstacle separation, and auto-reverse unstick state machine.
 */
export class AIController {
  constructor(car, splineSamples, offsetLane = 0) {
    this.car = car;
    this.samples = splineSamples;
    this.offsetLane = offsetLane; // -1 to 1 across track width
    this.currentSampleIndex = 0;
    this.lookaheadSteps = 9; // Number of spline points forward

    // Stuck Recovery State Machine
    this.state = 'FORWARD'; // 'FORWARD' | 'REVERSING' | 'RECOVERING'
    this.stuckTimer = 0;
    this.reverseTimer = 0;
    this.recoverTimer = 0;
    this.reverseSteerSign = 1;
  }

  update(dt, difficultyMultiplier = 1.0, peerCars = [], powerUpManager = null) {
    const pos = this.car.body.position;
    const forwardSpeed = Math.abs(this.car.forwardVelocity);

    // Autonomous Combat AI: trigger held power-up opportunistically
    if (powerUpManager && this.car.heldPowerUp && !this.car.isRouletteActive) {
      if (!this.combatCooldown) this.combatCooldown = 1.0 + Math.random() * 2.0;
      this.combatCooldown -= dt;
      if (this.combatCooldown <= 0) {
        powerUpManager.usePowerUp(this.car, peerCars);
        this.combatCooldown = 3.0 + Math.random() * 3.0;
      }
    }

    // 1. Locate nearest spline point
    let closestDist = Infinity;
    let closestIndex = this.currentSampleIndex;
    const searchWindow = 25;
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

    // 2. Stuck Detection & Recovery State Machine
    if (this.state === 'FORWARD') {
      if (forwardSpeed < 18) {
        this.stuckTimer += dt;
        if (this.stuckTimer > 0.65) {
          // AI is jammed against a barrier or car: initiate reverse unstick
          this.state = 'REVERSING';
          this.reverseTimer = 0.75; // reverse for 0.75 seconds
          this.reverseSteerSign = Math.random() > 0.5 ? 1 : -1;
          this.stuckTimer = 0;
        }
      } else {
        this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2);
      }
    } else if (this.state === 'REVERSING') {
      this.reverseTimer -= dt;
      if (this.reverseTimer <= 0) {
        this.state = 'RECOVERING';
        this.recoverTimer = 0.4;
      }
      return {
        throttle: 0.0,
        brake: 1.0, // Reversing gear in Car.js
        steer: this.reverseSteerSign * -1.0,
        handbrake: false,
        reset: false
      };
    } else if (this.state === 'RECOVERING') {
      this.recoverTimer -= dt;
      if (this.recoverTimer <= 0) {
        this.state = 'FORWARD';
      }
    }

    // 3. Select lookahead target point with lane offset
    const targetIdx = (this.currentSampleIndex + this.lookaheadSteps) % n;
    const targetSample = this.samples[targetIdx];
    let laneOffset = this.offsetLane * 28;

    // Dynamic car separation: avoid bunching up with nearby cars
    if (peerCars && peerCars.length > 0) {
      const heading = Vec2.fromAngle(this.car.body.angle);
      for (const other of peerCars) {
        if (other === this.car) continue;
        const toOther = other.body.position.clone().sub(pos);
        const dist = toOther.length();
        if (dist < 55 && toOther.dot(heading) > 0) {
          // Another car is close directly ahead: push lateral lane away
          const otherRight = toOther.dot(new Vec2(-heading.y, heading.x));
          if (otherRight >= 0) {
            laneOffset -= 22; // steer left
          } else {
            laneOffset += 22; // steer right
          }
          break;
        }
      }
    }

    const targetPoint = targetSample.point.clone().add(
      targetSample.normal.clone().scale(laneOffset)
    );

    // 4. Compute steering angle towards target
    const toTarget = targetPoint.clone().sub(pos);
    const desiredHeading = toTarget.angle();
    const currentHeading = this.car.body.angle;

    // Calculate signed angular difference normalized to [-PI, PI]
    let diff = desiredHeading - currentHeading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const steer = Math.max(-1, Math.min(1, diff * 2.4));

    // 5. Throttle / Braking logic based on upcoming corner sharpness
    const turnSeverity = Math.abs(diff);
    let throttle = 1.0;
    let brake = 0.0;

    if (turnSeverity > 0.70) {
      // Approaching sharp curve: brake to avoid sliding out
      throttle = 0.35 * difficultyMultiplier;
      if (this.car.forwardVelocity > 240) {
        brake = 0.65;
      }
    } else {
      throttle = 1.0 * difficultyMultiplier;
    }

    return {
      throttle,
      brake,
      steer,
      handbrake: turnSeverity > 1.25 && this.car.forwardVelocity > 230,
      reset: false
    };
  }
}
