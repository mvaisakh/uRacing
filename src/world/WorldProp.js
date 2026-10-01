import { Vec2 } from '../math/Vec2.js';
import { CircleCollider, AABB } from '../physics/Colliders.js';

/**
 * Prop: Micro tabletop props (cups, AA batteries, erasers, soda cans, screwdrivers)
 */
export class WorldProp {
  constructor({ id, type, x, y, radius = 25, width = 40, height = 20, angle = 0, color = '#e74c3c' }) {
    this.id = id;
    this.type = type; // 'cylinder' (soda can/cup/battery) or 'box' (eraser/matchbox)
    this.position = new Vec2(x, y);
    this.radius = radius;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.color = color;

    if (type === 'cylinder') {
      this.collider = new CircleCollider(this.position, radius);
    } else {
      this.collider = new AABB(x - width / 2, y - height / 2, x + width / 2, y + height / 2);
    }
  }

  resolveCollision(car) {
    const carPos = car.body.position;
    const carRadius = car.width * 0.65;

    if (this.type === 'cylinder') {
      const dist = carPos.distanceTo(this.position);
      const minDis = this.radius + carRadius;
      if (dist < minDis) {
        let normal = carPos.clone().sub(this.position).normalize();
        if (dist === 0) normal = new Vec2(1, 0);

        const penetration = minDis - dist;
        car.body.position.add(normal.clone().scale(penetration));

        const dot = car.body.velocity.dot(normal);
        if (dot < 0) {
          car.body.velocity.sub(normal.clone().scale(dot * 1.5));
        }
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    if (this.type === 'cylinder') {
      ctx.arc(4, 6, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Top rim & can lid
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner silver ring
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Soda pull tab
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-2, -this.radius * 0.5, 4, this.radius * 0.5);
    } else {
      ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 6, this.width, this.height);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }
    ctx.restore();
  }
}
