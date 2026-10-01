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

    // 4. Low-Poly 3D Slices
    const zSpacing = 3.5;
    
    // Chassis Slices
    const chassisSlices = 4;
    for (let slice = 0; slice < chassisSlices; slice++) {
      const zOffset = slice * zSpacing; 
      const lightFactor = -15 + slice * 6;
      const baseColor = this._adjustBrightness(spec.color, lightFactor);

      ctx.save();
      const t = ctx.getTransform();
      t.f -= zOffset * t.a;
      ctx.setTransform(t);
      this._renderChassisMesh(ctx, hw, hl, baseColor, spec.id);
      
      // Details on the top chassis slice (hood, headlights, taillights)
      if (slice === chassisSlices - 1) {
        this._renderChassisDetails(ctx, hw, hl, spec, car);
      }
      ctx.restore();
    }

    // Cabin Slices (Windows & Roof)
    const cabinSlices = 4;
    for (let slice = 0; slice < cabinSlices; slice++) {
      const zOffset = (chassisSlices + slice) * zSpacing; 
      const lightFactor = -5 + slice * 5;
      
      ctx.save();
      
      // True vertical screen-space extrusion for cabin
      const t = ctx.getTransform();
      t.f -= zOffset * t.a;
      ctx.setTransform(t);
      
      // The cabin shape is smaller than the chassis
      this._renderCabinMesh(ctx, hw, hl, spec, slice, cabinSlices, lightFactor);
      
      if (slice === cabinSlices - 1) {
        this._renderRoofDetails(ctx, hw, hl, spec);
      }
      
      ctx.restore();
    }

    ctx.restore();
  }

  static _renderChassisMesh(ctx, hw, hl, color, carId) {
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1.0;

    ctx.beginPath();
    if (carId === 'maranello_rosso' || carId === 'stuttgart_arrow') {
      // Sports/Supercar (Wedge/Sleek)
      ctx.moveTo(-hw * 0.8, hl);
      ctx.lineTo(hw * 0.8, hl);
      ctx.lineTo(hw, hl * 0.5);
      ctx.lineTo(hw * 1.05, -hl * 0.7);
      ctx.lineTo(hw * 0.85, -hl);
      ctx.lineTo(-hw * 0.85, -hl);
      ctx.lineTo(-hw * 1.05, -hl * 0.7);
      ctx.lineTo(-hw, hl * 0.5);
    } else if (carId === 'group_b_monster') {
      // Hot Hatch / Rally (Boxy, wide fenders)
      ctx.moveTo(-hw * 0.9, hl * 0.9);
      ctx.lineTo(hw * 0.9, hl * 0.9);
      ctx.lineTo(hw * 1.1, hl * 0.5);
      ctx.lineTo(hw * 0.95, 0);
      ctx.lineTo(hw * 1.1, -hl * 0.6);
      ctx.lineTo(hw * 0.9, -hl * 0.9);
      ctx.lineTo(-hw * 0.9, -hl * 0.9);
      ctx.lineTo(-hw * 1.1, -hl * 0.6);
      ctx.lineTo(-hw * 0.95, 0);
      ctx.lineTo(-hw * 1.1, hl * 0.5);
    } else {
      // Sedan / Muscle (Standard)
      ctx.moveTo(-hw * 0.85, hl * 0.95);
      ctx.lineTo(hw * 0.85, hl * 0.95);
      ctx.lineTo(hw, hl * 0.6);
      ctx.lineTo(hw, -hl * 0.8);
      ctx.lineTo(hw * 0.85, -hl);
      ctx.lineTo(-hw * 0.85, -hl);
      ctx.lineTo(-hw, -hl * 0.8);
      ctx.lineTo(-hw, hl * 0.6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  static _renderChassisDetails(ctx, hw, hl, spec, car) {
    // Front Grille
    ctx.fillStyle = '#111';
    if (spec.id === 'detroit_bruiser') {
      ctx.fillRect(-hw * 0.5, hl * 0.9, hw, hl * 0.1);
    } else if (spec.id === 'stuttgart_arrow') {
      // No front grille
    } else {
      ctx.fillRect(-hw * 0.4, hl * 0.9, hw * 0.8, hl * 0.1);
    }

    // Racing Stripes
    if (spec.stripeColor) {
      ctx.fillStyle = spec.stripeColor;
      ctx.fillRect(-2, -hl * 0.9, 4, hl * 1.8);
    }

    // Headlights
    ctx.fillStyle = '#fffbc8';
    if (spec.id === 'maranello_rosso') {
      // Pop-up headlights style
      ctx.fillRect(-hw * 0.8, hl * 0.6, hw * 0.4, hl * 0.15);
      ctx.fillRect(hw * 0.4, hl * 0.6, hw * 0.4, hl * 0.15);
    } else {
      ctx.beginPath();
      ctx.arc(-hw * 0.6, hl * 0.85, 2, 0, Math.PI * 2);
      ctx.arc(hw * 0.6, hl * 0.85, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Taillights
    const isBraking = car.forwardVelocity < -1 || car.isDrifting;
    ctx.fillStyle = isBraking ? '#ff3838' : '#c0392b';
    ctx.fillRect(-hw * 0.8, -hl * 0.95, hw * 0.5, hl * 0.15);
    ctx.fillRect(hw * 0.3, -hl * 0.95, hw * 0.5, hl * 0.15);
    
    // Rear Wing / Spoiler
    if (spec.id === 'group_b_monster' || spec.id === 'tokyo_drift_king' || spec.id === 'maranello_rosso') {
      ctx.fillStyle = '#11141a';
      ctx.fillRect(-hw * 0.9, -hl * 0.9, hw * 1.8, hl * 0.2);
    }
  }

  static _renderCabinMesh(ctx, hw, hl, spec, sliceIdx, maxSlices, lightFactor) {
    // Cabin tapers inwards slightly as it goes up
    const taper = 1.0 - (sliceIdx / maxSlices) * 0.15;
    const cW = hw * 0.75 * taper;
    
    // Different cars have different cabin lengths
    let cL_front = hl * 0.2;
    let cL_rear = -hl * 0.6;
    
    if (spec.id === 'detroit_bruiser') {
      // Long hood, short rear deck
      cL_front = hl * 0.1;
      cL_rear = -hl * 0.7;
    } else if (spec.id === 'stuttgart_arrow' || spec.id === 'maranello_rosso') {
      // Sloping fastback
      cL_front = hl * 0.3;
      cL_rear = -hl * 0.8;
    } else if (spec.id === 'group_b_monster') {
      // Hatchback shape
      cL_front = hl * 0.4;
      cL_rear = -hl * 0.9;
    }

    // Check if this slice is rendering windows (middle slices) or roof (top slices)
    const isWindowSlice = sliceIdx < maxSlices - 1;
    
    if (isWindowSlice) {
      // Draw pillars and windows
      ctx.fillStyle = '#111'; // Window color
      ctx.beginPath();
      ctx.moveTo(-cW, cL_front);
      ctx.lineTo(cW, cL_front);
      ctx.lineTo(cW * 0.9, cL_rear);
      ctx.lineTo(-cW * 0.9, cL_rear);
      ctx.fill();
      
      // Draw Pillars
      ctx.fillStyle = spec.color;
      // A-Pillar
      ctx.fillRect(-cW, cL_front - 2, 2, 4);
      ctx.fillRect(cW - 2, cL_front - 2, 2, 4);
      // B-Pillar
      ctx.fillRect(-cW * 0.95, (cL_front + cL_rear) / 2, 2, 4);
      ctx.fillRect(cW * 0.95 - 2, (cL_front + cL_rear) / 2, 2, 4);
      // C-Pillar
      ctx.fillRect(-cW * 0.9, cL_rear - 1, 2, 4);
      ctx.fillRect(cW * 0.9 - 2, cL_rear - 1, 2, 4);
      
    } else {
      // Draw solid roof
      ctx.fillStyle = this._adjustBrightness(spec.color, lightFactor);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(-cW, cL_front);
      ctx.lineTo(cW, cL_front);
      ctx.lineTo(cW * 0.9, cL_rear);
      ctx.lineTo(-cW * 0.9, cL_rear);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  static _renderRoofDetails(ctx, hw, hl, spec) {
    // Sunroof for some cars
    if (spec.id === 'tokyo_drift_king' || spec.id === 'detroit_bruiser') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-hw * 0.4, -hl * 0.2, hw * 0.8, hl * 0.3);
    }
    
    // Roof scoop
    if (spec.id === 'group_b_monster') {
      ctx.fillStyle = '#222';
      ctx.fillRect(-hw * 0.2, hl * 0.1, hw * 0.4, hl * 0.2);
    }
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
