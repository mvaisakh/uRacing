import { Vec2 } from '../math/Vec2.js';
import { RigidBody2D } from '../physics/RigidBody2D.js';

/**
 * Car: Encapsulates vehicle kinematics, wheel traction vectors, and steering.
 */
export class Car {
  constructor(spec) {
    this.spec = spec;
    this.body = new RigidBody2D({
      mass: spec.stats.weight,
      linearDamping: 0.985,
      angularDamping: 0.90
    });

    this.width = 18;
    this.length = 34;

    this.forwardVelocity = 0;
    this.lateralVelocity = 0;
    this.isDrifting = false;
    this.surfaceGripMultiplier = 1.0;
  }

  reset(x = 0, y = 0, angle = 0) {
    this.body.position.set(x, y);
    this.body.velocity.set(0, 0);
    this.body.acceleration.set(0, 0);
    this.body.angle = angle;
    this.body.angularVelocity = 0;
    this.forwardVelocity = 0;
    this.lateralVelocity = 0;
    this.isDrifting = false;
  }

  update(controls, dt) {
    const { throttle, brake, steer, handbrake } = controls;
    const heading = Vec2.fromAngle(this.body.angle);
    const right = new Vec2(-heading.y, heading.x);

    // Decompose velocity into heading (forward) and lateral (sideways) components
    this.forwardVelocity = this.body.velocity.dot(heading);
    this.lateralVelocity = this.body.velocity.dot(right);

    // 1. Throttle / Acceleration Force (modulates with surface traction & hauling torque)
    if (throttle > 0) {
      const topSpeedCap = (this.surfaceType === 'mud' || this.surfaceType === 'dirt')
        ? this.spec.stats.topSpeed * (0.65 + (this.spec.stats.offroad || 0.5) * 0.35)
        : this.spec.stats.topSpeed;

      if (this.forwardVelocity < topSpeedCap) {
        // Torque provides raw pulling force in rough terrain (SUVs power through mud while supercars bog down)
        const torqueFactor = (this.surfaceType === 'mud' || this.surfaceType === 'dirt')
          ? ((this.spec.stats.torque || 400) / 450)
          : 1.0;
        const driveForce = heading.clone().scale(throttle * this.spec.stats.acceleration * this.surfaceGripMultiplier * torqueFactor);
        this.body.applyForce(driveForce);
      }
    }

    // 2. Braking / Reverse
    if (brake > 0) {
      if (this.forwardVelocity > 5) {
        // Active braking
        const brakeForce = heading.clone().scale(-brake * this.spec.stats.braking);
        this.body.applyForce(brakeForce);
      } else {
        // Reverse gear
        const reverseForce = heading.clone().scale(-brake * this.spec.stats.acceleration * 0.45);
        this.body.applyForce(reverseForce);
      }
    }

    // 3. Steering & Yaw calculation based on speed
    const speedRatio = Math.min(Math.abs(this.forwardVelocity) / 100, 1.0);
    const reverseMultiplier = this.forwardVelocity < -2 ? -1.0 : 1.0;

    let steerTorque = steer * this.spec.stats.steerRate * speedRatio * reverseMultiplier;
    if (handbrake) {
      steerTorque *= 1.4; // Exaggerate slide turn-in
    }
    this.body.applyTorque(steerTorque * 12);

    // 4. Lateral Friction & Drift Slip (Lateral Traction elimination)
    let grip = this.spec.stats.grip * this.surfaceGripMultiplier;
    if (handbrake) {
      grip *= 0.35;
      this.isDrifting = true;
    } else if (Math.abs(this.lateralVelocity) > 60) {
      this.isDrifting = true;
      grip *= this.spec.stats.driftFactor;
    } else {
      this.isDrifting = false;
    }

    // Cancel sideways slip according to grip
    const lateralCancellation = right.clone().scale(-this.lateralVelocity * grip * 10 * dt);
    this.body.velocity.add(lateralCancellation);

    // Natural rolling resistance
    const rollingResistance = heading.clone().scale(-this.forwardVelocity * 0.35 * dt);
    this.body.velocity.add(rollingResistance);

    // Integrate rigid body mechanics
    this.body.integrate(dt);
  }
}
