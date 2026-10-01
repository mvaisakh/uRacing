/**
 * VehicleRenderer: Procedural die-cast car renderer with ambient drop shadows,
 * metallic enamel reflection gradients, windshield glass, and micro wheels.
 */
export class VehicleRenderer {
  /**
   * Render a micro die-cast car onto the 2D canvas context.
   */
  static render(ctx, car) {
    const { position, angle } = car.body;
    const { width, length, spec } = car;
    const hw = width / 2;
    const hl = length / 2;

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    // 1. Die-cast Miniature Drop Shadow (offset for pseudo-3D height feel)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this._drawRoundedRect(ctx, -hw - 1, -hl - 1, width + 2, length + 2, 4);
    ctx.fill();
    ctx.restore();

    // 2. Wheels / Micro Rubber Tires
    ctx.fillStyle = '#111315';
    const wheelW = 4;
    const wheelL = 9;
    // Front wheels (steer slightly with angular kick)
    const steerAngle = (car.body.angularVelocity || 0) * 0.15;

    // Front-Left
    this._drawWheel(ctx, -hw - 1.5, hl * 0.45, wheelW, wheelL, steerAngle);
    // Front-Right
    this._drawWheel(ctx, hw - 2.5, hl * 0.45, wheelW, wheelL, steerAngle);
    // Rear-Left
    this._drawWheel(ctx, -hw - 1.5, -hl * 0.6, wheelW, wheelL, 0);
    // Rear-Right
    this._drawWheel(ctx, hw - 2.5, -hl * 0.6, wheelW, wheelL, 0);

    // 3. Painted Die-cast Body Shell
    const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
    bodyGrad.addColorStop(0, this._adjustBrightness(spec.color, -25));
    bodyGrad.addColorStop(0.35, spec.color);
    bodyGrad.addColorStop(0.7, this._adjustBrightness(spec.color, 35)); // metallic enamel highlight
    bodyGrad.addColorStop(1, this._adjustBrightness(spec.color, -20));

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1.2;
    this._drawRoundedRect(ctx, -hw, -hl, width, length, 4);
    ctx.fill();
    ctx.stroke();

    // 4. Racing Stripes or Aerodynamic Accent Line
    if (spec.stripeColor) {
      ctx.fillStyle = spec.stripeColor;
      ctx.fillRect(-2, -hl + 2, 4, length - 4);
    }

    // 5. Windshield and Cabin Cockpit
    ctx.fillStyle = '#1a252f';
    const cabinW = width * 0.68;
    const cabinL = length * 0.45;
    this._drawRoundedRect(ctx, -cabinW / 2, -cabinL * 0.4, cabinW, cabinL, 3);
    ctx.fill();

    // Windshield specular gloss reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(-cabinW / 2 + 2, -cabinL * 0.35);
    ctx.lineTo(cabinW / 2 - 2, -cabinL * 0.35);
    ctx.lineTo(cabinW / 2 - 4, -cabinL * 0.1);
    ctx.lineTo(-cabinW / 2 + 4, -cabinL * 0.1);
    ctx.closePath();
    ctx.fill();

    // 6. Headlights (Bright xenon micro dots)
    ctx.fillStyle = '#fff9d2';
    ctx.fillRect(-hw + 2, hl - 2, 3.5, 2);
    ctx.fillRect(hw - 5.5, hl - 2, 3.5, 2);

    // 7. Taillights (Red micro glow)
    ctx.fillStyle = car.forwardVelocity < -1 ? '#ffffff' : (car.isDrifting ? '#ff3838' : '#c0392b');
    ctx.fillRect(-hw + 2, -hl, 3.5, 2);
    ctx.fillRect(hw - 5.5, -hl, 3.5, 2);

    ctx.restore();
  }

  static _drawWheel(ctx, x, y, w, l, angle) {
    ctx.save();
    ctx.translate(x + w / 2, y + l / 2);
    ctx.rotate(angle);
    ctx.fillStyle = '#0a0a0c';
    this._drawRoundedRect(ctx, -w / 2, -l / 2, w, l, 1.5);
    ctx.fill();
    // Silver wheel rim dot
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  static _drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  static _adjustBrightness(hex, percent) {
    let num = parseInt(hex.replace('#', ''), 16);
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
