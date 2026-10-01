import { Vec2 } from '../math/Vec2.js';
import { CircleCollider, AABB } from '../physics/Colliders.js';

/**
 * Prop: Micro tabletop props with 2.5D pseudo-3D extrusion (soda cans, batteries, coffee mugs, sponge boxes)
 */
export class WorldProp {
  constructor({ id, type, x, y, radius = 25, width = 40, height = 20, angle = 0, color = '#e74c3c', height3D = 22 }) {
    this.id = id;
    this.type = type; // 'cylinder' (soda can/cup/battery) or 'box' (eraser/matchbox)
    this.position = new Vec2(x, y);
    this.radius = radius;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.color = color;
    this.height3D = height3D;

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

    const h = this.height3D;

    // 1. Cast Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    if (this.type === 'cylinder') {
      ctx.beginPath();
      ctx.arc(8, 10, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Cylindrical Extrusion Wall (Rendered slice by slice)
      const slices = 8;
      for (let s = 0; s < slices; s++) {
        const offset = - (s / slices) * h;
        ctx.fillStyle = this._shadeColor(this.color, -30 + s * 3);
        ctx.beginPath();
        ctx.arc(0, offset, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Top Rim & Metal Can Top (elevated at -h)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, -h, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner silver ring
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -h, this.radius * 0.78, 0, Math.PI * 2);
      ctx.stroke();

      // Soda pull tab
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(-2.5, -h - this.radius * 0.5, 5, this.radius * 0.5);
    } else {
      // 3D Box Extrusion
      ctx.fillRect(-this.width / 2 + 8, -this.height / 2 + 10, this.width, this.height);

      const slices = 6;
      for (let s = 0; s < slices; s++) {
        const offset = - (s / slices) * h;
        ctx.fillStyle = this._shadeColor(this.color, -25 + s * 4);
        ctx.fillRect(-this.width / 2, -this.height / 2 + offset, this.width, this.height);
      }

      // Top box face
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, -this.height / 2 - h, this.width, this.height);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-this.width / 2, -this.height / 2 - h, this.width, this.height);
    }
    ctx.restore();
  }

  _shadeColor(color, percent) {
    let num = parseInt(color.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }
}
