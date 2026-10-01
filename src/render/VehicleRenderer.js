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

    // 4. True Low-Poly 3D Mesh (Replaces 2.5D slices)
    // Get the base world-to-screen transform matrix
    const t = ctx.getTransform();
    
    // Base height offset
    const zBase = 2;
    
    // Chassis Box
    const cW = hw * 1.8;
    const cL = hl * 1.9;
    const cH = 10;
    this._render3DBox(ctx, t, cW, cL, cH, zBase, spec.color);
    
    // Cabin Box
    const cabW = hw * 1.4;
    const cabL = hl * 0.9;
    const cabH = 8;
    const cabZ = zBase + cH;
    // Shift cabin slightly backwards
    this._render3DBox(ctx, t, cabW, cabL, cabH, cabZ, '#111111', 0, -hl * 0.2);

    ctx.restore();
  }

  static _shadeColor(color, amount) {
    let r = parseInt(color.substring(1,3), 16);
    let g = parseInt(color.substring(3,5), 16);
    let b = parseInt(color.substring(5,7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }

  static _project3D(t, x, y, z) {
    const sx = t.a * x + t.c * y + t.e;
    const sy = t.b * x + t.d * y + t.f;
    // Exact vertical screen-space extrusion (using horizontal scale factor)
    const scale = Math.hypot(t.a, t.b);
    return { x: sx, y: sy - z * scale };
  }

  static _render3DBox(ctx, t, w, l, h, zOffset, color, offsetX = 0, offsetY = 0) {
    const hw = w / 2;
    const hl = l / 2;
    
    // 8 Corners of the box in local car space
    const corners = [
      { x: offsetX + hw, y: offsetY + hl, z: zOffset + h }, // 0: Top Front Right
      { x: offsetX - hw, y: offsetY + hl, z: zOffset + h }, // 1: Top Front Left
      { x: offsetX - hw, y: offsetY - hl, z: zOffset + h }, // 2: Top Back Left
      { x: offsetX + hw, y: offsetY - hl, z: zOffset + h }, // 3: Top Back Right
      { x: offsetX + hw, y: offsetY + hl, z: zOffset },     // 4: Bottom Front Right
      { x: offsetX - hw, y: offsetY + hl, z: zOffset },     // 5: Bottom Front Left
      { x: offsetX - hw, y: offsetY - hl, z: zOffset },     // 6: Bottom Back Left
      { x: offsetX + hw, y: offsetY - hl, z: zOffset }      // 7: Bottom Back Right
    ];

    // Project to screen space
    const proj = corners.map(c => this._project3D(t, c.x, c.y, c.z));

    // Define 5 visible faces (Bottom is never seen)
    const faces = [
      { v: [0, 1, 2, 3], norm: {x:0, y:0, z:1}, color: color }, // Top
      { v: [0, 3, 7, 4], norm: {x:1, y:0, z:0}, color: this._shadeColor(color, -25) }, // Right
      { v: [1, 0, 4, 5], norm: {x:0, y:1, z:0}, color: this._shadeColor(color, 15) }, // Front
      { v: [2, 1, 5, 6], norm: {x:-1, y:0, z:0}, color: this._shadeColor(color, -40) }, // Left
      { v: [3, 2, 6, 7], norm: {x:0, y:-1, z:0}, color: this._shadeColor(color, -60) }  // Back
    ];

    // Determine global camera look vector in local car space to do backface culling.
    // In our engine, camera is isometric (looks towards +X, +Y in world).
    // Actually, we can just use the Shoelace formula to find polygon screen-space winding order!
    // If signed area is positive, it's facing the camera.
    
    faces.forEach(f => {
      // Shoelace formula for 2D polygon area
      let area = 0;
      for (let i = 0; i < 4; i++) {
        const p1 = proj[f.v[i]];
        const p2 = proj[f.v[(i + 1) % 4]];
        area += (p2.x - p1.x) * (p2.y + p1.y);
      }
      
      // If area < 0, it's counter-clockwise (facing camera)
      if (area < 0) {
        ctx.fillStyle = f.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        
        // Reset transform to identity because points are already in absolute screen space
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.moveTo(proj[f.v[0]].x, proj[f.v[0]].y);
        for (let i = 1; i < 4; i++) {
          ctx.lineTo(proj[f.v[i]].x, proj[f.v[i]].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });
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
