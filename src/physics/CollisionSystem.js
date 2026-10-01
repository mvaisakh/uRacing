import { Vec2 } from '../math/Vec2.js';

/**
 * Barrier / Segment collision resolver
 */
export class Barrier {
  constructor(p1, p2, restitution = 0.45) {
    this.p1 = p1;
    this.p2 = p2;
    this.restitution = restitution; // bounciness factor
  }

  // Returns collision info if circle intersects segment
  testCircle(pos, radius) {
    const ab = this.p2.clone().sub(this.p1);
    const ap = pos.clone().sub(this.p1);
    const abLenSq = ab.lengthSq();

    if (abLenSq === 0) return null;

    // Projection factor clamped [0, 1]
    const t = Math.max(0, Math.min(1, ap.dot(ab) / abLenSq));
    const closest = new Vec2(this.p1.x + ab.x * t, this.p1.y + ab.y * t);

    const distVec = pos.clone().sub(closest);
    const dist = distVec.length();

    if (dist < radius) {
      let normal = distVec.clone().normalize();
      if (dist === 0) {
        // default perpendicular
        normal = new Vec2(-ab.y, ab.x).normalize();
      }
      return {
        penetration: radius - dist,
        normal,
        contactPoint: closest
      };
    }
    return null;
  }
}

export class CollisionSystem {
  static resolveCarBarrier(car, barrier) {
    // Treat the car as two spheres (front and rear axle) for realistic corner bumper bounces
    const heading = Vec2.fromAngle(car.body.angle);
    const halfLength = car.length * 0.35;
    const radius = car.width * 0.55;

    const frontPos = car.body.position.clone().add(heading.clone().scale(halfLength));
    const rearPos = car.body.position.clone().sub(heading.clone().scale(halfLength));

    const spheres = [frontPos, rearPos];

    for (const spherePos of spheres) {
      const hit = barrier.testCircle(spherePos, radius);
      if (hit) {
        // Push vehicle out of penetration
        car.body.position.add(hit.normal.clone().scale(hit.penetration));

        // Reflect velocity along normal
        const normalVel = car.body.velocity.dot(hit.normal);
        if (normalVel < 0) {
          const impulse = hit.normal.clone().scale(-(1 + barrier.restitution) * normalVel);
          car.body.velocity.add(impulse);
        }

        // Apply slight angular kick from off-center impact
        const r = spherePos.clone().sub(car.body.position);
        const torqueKick = r.cross(hit.normal) * 0.05;
        car.body.angularVelocity += torqueKick;
        return true;
      }
    }
    return false;
  }
}
