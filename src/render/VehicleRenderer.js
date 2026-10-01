/**
 * VehicleRenderer: Procedural 2.5D pseudo-3D die-cast car renderer.
 * Features stacked voxel/chassis extrusion layers, metallic specular enamel reflections,
 * cast drop-shadows with ground clearance, 3D windshield glass with specular tint,
 * realistic micro wheels with rim hubcaps, and directional headlights/taillights.
 */
export class VehicleRenderer {
  /**
   * Render a miniature 3D die-cast car onto the canvas.
   */
  static render(ctx, car) {
    const { position, angle } = car.body;
    const { width, length, spec } = car;
    const hw = width / 2;
    const hl = length / 2;

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    // 1. Ambient Ground Contact Drop Shadow (Separated for clearance elevation)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.filter = 'blur(4px)';
    ctx.beginPath();
    this._drawRoundedRect(ctx, -hw - 2 + 5, -hl - 2 + 7, width + 4, length + 4, 6);
    ctx.fill();
    ctx.restore();

    // 2. Wheels / Micro Rubber Tires with 3D Depth
    ctx.fillStyle = '#0f1114';
    const wheelW = 4.5;
    const wheelL = 10;
    const steerAngle = (car.body.angularVelocity || 0) * 0.16;

    // Front wheels (steerable)
    this._drawWheel3D(ctx, -hw - 2, hl * 0.42, wheelW, wheelL, steerAngle);
    this._drawWheel3D(ctx, hw - 2.5, hl * 0.42, wheelW, wheelL, steerAngle);
    // Rear wheels (fixed)
    this._drawWheel3D(ctx, -hw - 2, -hl * 0.62, wheelW, wheelL, 0);
    this._drawWheel3D(ctx, hw - 2.5, -hl * 0.62, wheelW, wheelL, 0);

    // 3. Lower Chassis Underbody (Dark shadow foundation)
    ctx.fillStyle = '#1c2028';
    this._drawRoundedRect(ctx, -hw + 1, -hl + 2, width - 2, length - 4, 3);
    ctx.fill();

    // 4. Pseudo-3D Body Shell Extrusion Layers (Stacking layers creates physical 3D die-cast thickness)
    const extrusionSlices = 4;
    for (let layer = 0; layer < extrusionSlices; layer++) {
      const offset = -layer * 1.5; // elevate upward in pseudo-Z
      const layerBrightness = -15 + layer * 10;
      const layerColor = this._adjustBrightness(spec.color, layerBrightness);

      ctx.save();
      ctx.translate(0, offset);

      // Body Gradient (Curved metallic surface lighting)
      const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
      grad.addColorStop(0, this._adjustBrightness(layerColor, -25));
      grad.addColorStop(0.25, layerColor);
      grad.addColorStop(0.55, this._adjustBrightness(layerColor, 35)); // Enamel gloss streak
      grad.addColorStop(0.85, layerColor);
      grad.addColorStop(1, this._adjustBrightness(layerColor, -20));

      ctx.fillStyle = grad;
      ctx.strokeStyle = layer === extrusionSlices - 1 ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1.0;
      this._drawRoundedRect(ctx, -hw, -hl, width, length, 4);
      ctx.fill();
      ctx.stroke();

      // Topmost layer details (Hood scoops, stripes, cockpit, lights)
      if (layer === extrusionSlices - 1) {
        // Racing stripes
        if (spec.stripeColor) {
          ctx.fillStyle = spec.stripeColor;
          ctx.fillRect(-2.5, -hl + 3, 5, length - 6);
        }

        // 5. 3D Elevated Cabin / Roof Greenhouse
        const cabinW = width * 0.72;
        const cabinL = length * 0.46;
        const cabinY = -cabinL * 0.35;

        // Cabin dark frame
        ctx.fillStyle = '#14181f';
        this._drawRoundedRect(ctx, -cabinW / 2, cabinY, cabinW, cabinL, 3);
        ctx.fill();

        // Front Windshield Glass
        const glassGrad = ctx.createLinearGradient(0, cabinY + cabinL * 0.6, 0, cabinY);
        glassGrad.addColorStop(0, '#34495e');
        glassGrad.addColorStop(0.5, '#5dade2');
        glassGrad.addColorStop(1, '#aed6f1');

        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.moveTo(-cabinW / 2 + 2, cabinY + cabinL * 0.65);
        ctx.lineTo(cabinW / 2 - 2, cabinY + cabinL * 0.65);
        ctx.lineTo(cabinW / 2 - 3, cabinY + cabinL * 0.95);
        ctx.lineTo(-cabinW / 2 + 3, cabinY + cabinL * 0.95);
        ctx.closePath();
        ctx.fill();

        // Windshield Specular Reflection Glare
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-cabinW / 2 + 3, cabinY + cabinL * 0.7);
        ctx.lineTo(cabinW / 2 - 4, cabinY + cabinL * 0.7);
        ctx.lineTo(cabinW / 2 - 7, cabinY + cabinL * 0.85);
        ctx.lineTo(-cabinW / 2 + 5, cabinY + cabinL * 0.85);
        ctx.closePath();
        ctx.fill();

        // Rear Window Glass
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(-cabinW / 2 + 2, cabinY + cabinL * 0.1);
        ctx.lineTo(cabinW / 2 - 2, cabinY + cabinL * 0.1);
        ctx.lineTo(cabinW / 2 - 4, cabinY + cabinL * 0.35);
        ctx.lineTo(-cabinW / 2 + 4, cabinY + cabinL * 0.35);
        ctx.closePath();
        ctx.fill();

        // Roof Panel
        ctx.fillStyle = layerColor;
        this._drawRoundedRect(ctx, -cabinW * 0.42, cabinY + cabinL * 0.35, cabinW * 0.84, cabinL * 0.32, 2);
        ctx.fill();

        // 6. Xenon Headlight lenses with glow halo
        ctx.fillStyle = '#fffbc8';
        ctx.fillRect(-hw + 2, hl - 2, 4, 2.5);
        ctx.fillRect(hw - 6, hl - 2, 4, 2.5);

        // 7. LED Taillights (Red / bright glow on brake or drift)
        const isBraking = car.forwardVelocity < -1 || car.isDrifting;
        ctx.fillStyle = isBraking ? '#ff3838' : '#c0392b';
        ctx.fillRect(-hw + 2, -hl, 4, 2.5);
        ctx.fillRect(hw - 6, -hl, 4, 2.5);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  static _drawWheel3D(ctx, x, y, w, l, angle) {
    ctx.save();
    ctx.translate(x + w / 2, y + l / 2);
    ctx.rotate(angle);

    // Tire tread
    ctx.fillStyle = '#0d0e12';
    this._drawRoundedRect(ctx, -w / 2, -l / 2, w, l, 2);
    ctx.fill();

    // Alloy Hubcap Rim
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

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
