import { Vec2 } from '../math/Vec2.js';

/**
 * RigidBody2D: Simple Newtonian physics integration with linear/angular velocities and damping.
 */
export class RigidBody2D {
  constructor({
    mass = 1.0,
    linearDamping = 0.98,
    angularDamping = 0.95
  } = {}) {
    this.mass = mass;
    this.invMass = mass > 0 ? 1 / mass : 0;
    this.position = new Vec2();
    this.velocity = new Vec2();
    this.acceleration = new Vec2();

    this.angle = 0; // In radians
    this.angularVelocity = 0;
    this.angularAcceleration = 0;

    this.linearDamping = linearDamping;
    this.angularDamping = angularDamping;
  }

  applyForce(force) {
    this.acceleration.x += force.x * this.invMass;
    this.acceleration.y += force.y * this.invMass;
  }

  applyTorque(torque) {
    this.angularAcceleration += torque * this.invMass;
  }

  integrate(dt) {
    // Semi-implicit Euler integration
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;

    // Apply linear damping
    const linearFactor = Math.pow(this.linearDamping, dt * 60);
    this.velocity.scale(linearFactor);

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Angular integration
    this.angularVelocity += this.angularAcceleration * dt;
    const angularFactor = Math.pow(this.angularDamping, dt * 60);
    this.angularVelocity *= angularFactor;
    this.angle += this.angularVelocity * dt;

    // Reset forces for next tick
    this.acceleration.set(0, 0);
    this.angularAcceleration = 0;
  }
}
