/**
 * VehicleRenderer: Low-poly procedural 3D die-cast vehicle mesh engine.
 * Renders faceted low-poly hoods, aerodynamic wings, diffusers, cabin pillars,
 * alloy rims with brake calipers, and era-accurate silhouettes for all 5 cars.
 */
export class VehicleRenderer {
  /**
   * Render a low-poly 3D die-cast car onto the 2D canvas context.
   */
  static render(ctx, car) {
    const { position, angle } = car.body;
    const { width, length, spec } = car;
    const hw = width / 2;
    const hl = length / 2;

    ctx.save();
    ctx.translate(position.x, position.y);
    // Rotate to align car's drawn +Y axis (front) with physical +X heading, 
    // and account for 3D camera rotation.
    ctx.rotate(angle - Math.PI / 2);

    // 1. Directional Ambient Ground Contact Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    this._drawRoundedRect(ctx, -hw - 3 + 4, -hl - 3 + 6, width + 6, length + 6, 6);
    ctx.fill();
    ctx.restore();

    // 2. Low-Poly 3D Wheels with Tire Thread and Disc Brakes
    const wheelW = 4.5;
    const wheelL = 10;
    const steerAngle = (car.body.angularVelocity || 0) * 0.16;

    // Front Wheels
    this._drawWheelLowPoly(ctx, -hw - 2.5, hl * 0.42, wheelW, wheelL, steerAngle);
    this._drawWheelLowPoly(ctx, hw - 2.0, hl * 0.42, wheelW, wheelL, steerAngle);
    // Rear Wheels
    this._drawWheelLowPoly(ctx, -hw - 2.5, -hl * 0.62, wheelW, wheelL, 0);
    this._drawWheelLowPoly(ctx, hw - 2.0, -hl * 0.62, wheelW, wheelL, 0);

    // 3. Lower Underbody Skirt / Diffuser (Dark chassis base)
    ctx.fillStyle = '#151921';
    this._drawRoundedRect(ctx, -hw + 1, -hl + 2, width - 2, length - 4, 3);
    ctx.fill();

    // 4. Low-Poly Faceted Chassis Slices (Extruded 3D body with bevelled facets)
    const totalSlices = 5;
    for (let slice = 0; slice < totalSlices; slice++) {
      // Local +Y points visually UP in chase cam, so use positive offset
      const zOffset = slice * 1.6; 
      const lightFactor = -18 + slice * 8;
      const baseColor = this._adjustBrightness(spec.color, lightFactor);

      ctx.save();
      ctx.translate(0, zOffset);

      // Low-poly faceted body shell
      this._renderCarBodyMesh(ctx, hw, hl, baseColor, spec.id);

      // Topmost layer details: Hood vents, rear wing, cockpit, headlights
      if (slice === totalSlices - 1) {
        this._renderCarTopDetails(ctx, hw, hl, spec, car);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  static _renderCarBodyMesh(ctx, hw, hl, color, carId) {
    // Faceted low-poly panel lighting
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.0;

    // Different silhouette shapes per automotive era
    ctx.beginPath();
    if (carId === 'maranello_rosso') {
      // Wedge Supercar geometry (Narrow nose, flared rear air intakes)
      ctx.moveTo(-hw * 0.65, hl);
      ctx.lineTo(hw * 0.65, hl);
      ctx.lineTo(hw, hl * 0.2);
      ctx.lineTo(hw * 1.05, -hl * 0.6);
      ctx.lineTo(hw * 0.9, -hl);
      ctx.lineTo(-hw * 0.9, -hl);
      ctx.lineTo(-hw * 1.05, -hl * 0.6);
      ctx.lineTo(-hw, hl * 0.2);
    } else if (carId === 'group_b_monster') {
      // Boxy Rally Homologation (Flared box fenders)
      ctx.moveTo(-hw * 0.85, hl);
      ctx.lineTo(hw * 0.85, hl);
      ctx.lineTo(hw * 1.08, hl * 0.6);
      ctx.lineTo(hw * 1.08, hl * 0.3);
      ctx.lineTo(hw * 0.9, 0);
      ctx.lineTo(hw * 1.08, -hl * 0.4);
      ctx.lineTo(hw * 1.08, -hl * 0.8);
      ctx.lineTo(hw * 0.85, -hl);
      ctx.lineTo(-hw * 0.85, -hl);
      ctx.lineTo(-hw * 1.08, -hl * 0.8);
      ctx.lineTo(-hw * 1.08, -hl * 0.4);
      ctx.lineTo(-hw * 0.9, 0);
      ctx.lineTo(-hw * 1.08, hl * 0.3);
      ctx.lineTo(-hw * 1.08, hl * 0.6);
    } else {
      // Classic Muscle / Sports GT
      ctx.moveTo(-hw * 0.8, hl);
      ctx.lineTo(hw * 0.8, hl);
      ctx.lineTo(hw, hl * 0.4);
      ctx.lineTo(hw, -hl * 0.8);
      ctx.lineTo(hw * 0.85, -hl);
      ctx.lineTo(-hw * 0.85, -hl);
      ctx.lineTo(-hw, -hl * 0.8);
      ctx.lineTo(-hw, hl * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central low-poly hood ridge line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, hl * 0.8);
    ctx.lineTo(0, -hl * 0.8);
    ctx.stroke();
  }

  static _renderCarTopDetails(ctx, hw, hl, spec, car) {
    // 1. Racing livery stripe
    if (spec.stripeColor) {
      ctx.fillStyle = spec.stripeColor;
      ctx.fillRect(-2.5, -hl + 3, 5, hl * 2 - 6);
    }

    // 2. Low-Poly Cabin Cockpit Glass
    const cabinW = hw * 1.35;
    const cabinL = hl * 0.95;
    const cabinY = -cabinL * 0.35;

    // Windshield frame
    ctx.fillStyle = '#14181f';
    ctx.beginPath();
    ctx.moveTo(-cabinW * 0.42, cabinY + cabinL * 0.9);
    ctx.lineTo(cabinW * 0.42, cabinY + cabinL * 0.9);
    ctx.lineTo(cabinW * 0.5, cabinY);
    ctx.lineTo(-cabinW * 0.5, cabinY);
    ctx.closePath();
    ctx.fill();

    // Windshield tinted glass with specular shine
    const glassGrad = ctx.createLinearGradient(0, cabinY + cabinL * 0.85, 0, cabinY + cabinL * 0.3);
    glassGrad.addColorStop(0, '#2980b9');
    glassGrad.addColorStop(0.5, '#54a0ff');
    glassGrad.addColorStop(1, '#c8d6e5');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(-cabinW * 0.38, cabinY + cabinL * 0.85);
    ctx.lineTo(cabinW * 0.38, cabinY + cabinL * 0.85);
    ctx.lineTo(cabinW * 0.44, cabinY + cabinL * 0.35);
    ctx.lineTo(-cabinW * 0.44, cabinY + cabinL * 0.35);
    ctx.closePath();
    ctx.fill();

    // Roof panel
    ctx.fillStyle = this._adjustBrightness(spec.color, 15);
    ctx.fillRect(-cabinW * 0.4, cabinY + cabinL * 0.05, cabinW * 0.8, cabinL * 0.32);

    // Rear window
    ctx.fillStyle = '#222f3e';
    ctx.beginPath();
    ctx.moveTo(-cabinW * 0.38, cabinY + cabinL * 0.05);
    ctx.lineTo(cabinW * 0.38, cabinY + cabinL * 0.05);
    ctx.lineTo(cabinW * 0.45, cabinY - cabinL * 0.22);
    ctx.lineTo(-cabinW * 0.45, cabinY - cabinL * 0.22);
    ctx.closePath();
    ctx.fill();

    // 3. Aerodynamic Rear Wing / Spoiler (Group B & Tokyo Drift-King)
    if (spec.id === 'group_b_monster' || spec.id === 'tokyo_drift_king' || spec.id === 'stuttgart_arrow') {
      ctx.fillStyle = '#11141a';
      // Wing struts
      ctx.fillRect(-hw * 0.65, -hl - 1, 3, 4);
      ctx.fillRect(hw * 0.65 - 3, -hl - 1, 3, 4);
      // Wing foil blade
      ctx.fillStyle = spec.id === 'group_b_monster' ? '#e1b12c' : '#222f3e';
      ctx.fillRect(-hw * 0.9, -hl - 3, hw * 1.8, 3.5);
    }

    // 4. Xenon Headlight lenses
    ctx.fillStyle = '#fffbc8';
    ctx.fillRect(-hw + 3, hl - 2.5, 4, 2);
    ctx.fillRect(hw - 7, hl - 2.5, 4, 2);

    // 5. LED Taillights (Red glow, bright on brake / drift)
    const isBraking = car.forwardVelocity < -1 || car.isDrifting;
    ctx.fillStyle = isBraking ? '#ff3838' : '#c0392b';
    ctx.fillRect(-hw + 3, -hl, 4, 2);
    ctx.fillRect(hw - 7, -hl, 4, 2);
  }

  static _drawWheelLowPoly(ctx, x, y, w, l, angle) {
    ctx.save();
    ctx.translate(x + w / 2, y + l / 2);
    ctx.rotate(angle);

    // Tire tread
    ctx.fillStyle = '#0f1115';
    ctx.beginPath();
    this._drawRoundedRect(ctx, -w / 2, -l / 2, w, l, 2);
    ctx.fill();

    // Wheel rim hubcap (Multi-spoke low-poly dot)
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.arc(0, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, 0, 0.8, 0, Math.PI * 2);
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
