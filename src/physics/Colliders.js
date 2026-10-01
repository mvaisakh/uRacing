import { Vec2 } from '../math/Vec2.js';

/**
 * Axis-Aligned Bounding Box (AABB)
 */
export class AABB {
  constructor(minX = 0, minY = 0, maxX = 0, maxY = 0) {
    this.min = new Vec2(minX, minY);
    this.max = new Vec2(maxX, maxY);
  }

  intersectsAABB(other) {
    return !(
      this.max.x < other.min.x ||
      this.min.x > other.max.x ||
      this.max.y < other.min.y ||
      this.min.y > other.max.y
    );
  }

  containsPoint(p) {
    return (
      p.x >= this.min.x &&
      p.x <= this.max.x &&
      p.y >= this.min.y &&
      p.y <= this.max.y
    );
  }
}

/**
 * Circle Collider for fast radial checks (wheels, tire stacks, cones)
 */
export class CircleCollider {
  constructor(center = new Vec2(), radius = 10) {
    this.center = center;
    this.radius = radius;
  }

  intersectsCircle(other) {
    const distSq = this.center.distanceTo(other.center) ** 2;
    const radSum = this.radius + other.radius;
    return distSq <= radSum * radSum;
  }

  intersectsAABB(box) {
    const closestX = Math.max(box.min.x, Math.min(this.center.x, box.max.x));
    const closestY = Math.max(box.min.y, Math.min(this.center.y, box.max.y));

    const dx = this.center.x - closestX;
    const dy = this.center.y - closestY;

    return dx * dx + dy * dy <= this.radius * this.radius;
  }
}

/**
 * Oriented Bounding Box (OBB) representation for rotated die-cast vehicles
 */
export class OBB {
  constructor(center = new Vec2(), width = 20, height = 40, angle = 0) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }

  getCorners() {
    const hw = this.width / 2;
    const hh = this.height / 2;
    const corners = [
      new Vec2(-hw, -hh),
      new Vec2(hw, -hh),
      new Vec2(hw, hh),
      new Vec2(-hw, hh)
    ];

    return corners.map((c) => c.rotate(this.angle).add(this.center));
  }
}
