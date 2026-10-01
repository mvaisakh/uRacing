import { Vec2 } from '../math/Vec2.js';

/**
 * CarVsCarCollision: Detects and resolves elastic collisions between two moving cars.
 */
export class CarVsCarCollision {
  static resolve(carA, carB) {
    const posA = carA.body.position;
    const posB = carB.body.position;
    const radiusA = carA.width * 0.7;
    const radiusB = carB.width * 0.7;
    const minDist = radiusA + radiusB;

    const diff = posB.clone().sub(posA);
    const dist = diff.length();

    if (dist < minDist && dist > 0.0001) {
      const normal = diff.clone().scale(1 / dist); // Points from A to B
      const penetration = minDist - dist;

      // Position separation proportional to mass
      const totalMass = carA.body.mass + carB.body.mass;
      const ratioA = carB.body.mass / totalMass;
      const ratioB = carA.body.mass / totalMass;

      carA.body.position.sub(normal.clone().scale(penetration * ratioA));
      carB.body.position.add(normal.clone().scale(penetration * ratioB));

      // Velocity impulse calculation
      const relVel = carB.body.velocity.clone().sub(carA.body.velocity);
      const velAlongNormal = relVel.dot(normal);

      if (velAlongNormal < 0) { // Moving toward each other
        const restitution = 0.55; // Bouncy micro die-cast metal clack
        const impulseMag = -(1 + restitution) * velAlongNormal / (carA.body.invMass + carB.body.invMass);
        const impulse = normal.clone().scale(impulseMag);

        carA.body.velocity.sub(impulse.clone().scale(carA.body.invMass));
        carB.body.velocity.add(impulse.clone().scale(carB.body.invMass));

        // Slight angular spin transfer
        carA.body.angularVelocity += (Math.random() - 0.5) * 2;
        carB.body.angularVelocity += (Math.random() - 0.5) * 2;
        return true;
      }
    }
    return false;
  }
}
