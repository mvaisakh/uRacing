import { Vec2 } from '../math/Vec2.js';

/**
 * CarVsCarCollision: Detects and resolves elastic collisions between two moving cars.
 * Uses 2-circle capsule bounding volumes per vehicle to prevent bumper overlap.
 */
export class CarVsCarCollision {
  static resolve(carA, carB) {
    const headingA = Vec2.fromAngle(carA.body.angle);
    const headingB = Vec2.fromAngle(carB.body.angle);

    const halfL_A = (carA.length || 34) * 0.28;
    const halfL_B = (carB.length || 34) * 0.28;
    const radiusA = (carA.width || 18) * 0.55;
    const radiusB = (carB.width || 18) * 0.55;
    const minDist = radiusA + radiusB;

    const circlesA = [
      carA.body.position.clone().add(headingA.clone().scale(halfL_A)),
      carA.body.position.clone().sub(headingA.clone().scale(halfL_A))
    ];
    const circlesB = [
      carB.body.position.clone().add(headingB.clone().scale(halfL_B)),
      carB.body.position.clone().sub(headingB.clone().scale(halfL_B))
    ];

    let maxPenetration = 0;
    let colNormal = null;
    let contactPt = null;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const diff = circlesB[j].clone().sub(circlesA[i]);
        const dist = diff.length();
        if (dist < minDist && dist > 0.0001) {
          const pen = minDist - dist;
          if (pen > maxPenetration) {
            maxPenetration = pen;
            colNormal = diff.clone().scale(1 / dist); // Points from A to B
            contactPt = circlesA[i].clone().add(colNormal.clone().scale(radiusA));
          }
        }
      }
    }

    if (maxPenetration > 0 && colNormal) {
      // Position separation proportional to mass with small spring separation
      const totalMass = carA.body.mass + carB.body.mass;
      const ratioA = carB.body.mass / totalMass;
      const ratioB = carA.body.mass / totalMass;

      carA.body.position.sub(colNormal.clone().scale(maxPenetration * ratioA * 1.05));
      carB.body.position.add(colNormal.clone().scale(maxPenetration * ratioB * 1.05));

      // Velocity impulse calculation at contact point
      const rA = contactPt.clone().sub(carA.body.position);
      const rB = contactPt.clone().sub(carB.body.position);

      // Contact point velocities including angular velocity
      const vpA = new Vec2(
        carA.body.velocity.x - carA.body.angularVelocity * rA.y,
        carA.body.velocity.y + carA.body.angularVelocity * rA.x
      );
      const vpB = new Vec2(
        carB.body.velocity.x - carB.body.angularVelocity * rB.y,
        carB.body.velocity.y + carB.body.angularVelocity * rB.x
      );

      const relVel = vpB.sub(vpA);
      const velAlongNormal = relVel.dot(colNormal);

      if (velAlongNormal < 0) {
        const restitution = 0.65; // Die-cast toy metal bounce
        const rACrossN = rA.x * colNormal.y - rA.y * colNormal.x;
        const rBCrossN = rB.x * colNormal.y - rB.y * colNormal.x;
        const invInertiaA = 1 / (carA.body.inertia || 1);
        const invInertiaB = 1 / (carB.body.inertia || 1);

        const impulseMag = -(1 + restitution) * velAlongNormal / (
          carA.body.invMass + carB.body.invMass +
          (rACrossN * rACrossN) * invInertiaA +
          (rBCrossN * rBCrossN) * invInertiaB
        );

        const impulse = colNormal.clone().scale(impulseMag);
        carA.body.velocity.sub(impulse.clone().scale(carA.body.invMass));
        carB.body.velocity.add(impulse.clone().scale(carB.body.invMass));

        // Spin transfer
        carA.body.angularVelocity -= rACrossN * impulseMag * invInertiaA * 0.45;
        carB.body.angularVelocity += rBCrossN * impulseMag * invInertiaB * 0.45;

        return true;
      }
    }
    return false;
  }
}
