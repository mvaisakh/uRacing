/**
 * SpeedometerHUD: Analog dial gauge with glowing needle and gear/speed readout.
 */
export class SpeedometerHUD {
  constructor(size = 140) {
    this.size = size;
    this.radius = size / 2;
  }

  render(ctx, screenX, screenY, speed, topSpeed, isDrifting, health = 100) {
    ctx.save();
    ctx.translate(screenX + this.radius, screenY + this.radius);

    // 1. Dial Backdrop
    ctx.fillStyle = 'rgba(12, 16, 22, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 1.5. Vehicle Health / Structural Integrity Ring (Outer Border)
    const healthRatio = Math.max(0, Math.min(1, health / 100));
    const healthColor = healthRatio > 0.6 ? '#2ecc71' : (healthRatio > 0.3 ? '#f39c12' : '#e74c3c');
    
    // Background health track
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Active health arc
    ctx.strokeStyle = healthColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthRatio);
    ctx.stroke();

    // 2. Ticks & Outer Speed Arc
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalArc = endAngle - startAngle;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 12, startAngle, endAngle);
    ctx.stroke();

    // Active speed arc
    const speedRatio = Math.min(Math.max(0, speed / (topSpeed || 450)), 1.0);
    const activeAngle = startAngle + totalArc * speedRatio;

    ctx.strokeStyle = isDrifting ? '#ff7675' : '#00cec9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 12, startAngle, activeAngle);
    ctx.stroke();

    // 3. Dial Needle
    ctx.save();
    ctx.rotate(activeAngle);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(this.radius - 18, 0);
    ctx.stroke();
    ctx.restore();

    // Center pin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Digital readout
    const kmh = Math.max(0, Math.round(speed * 0.45));
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${kmh}`, 0, 20);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#8ab4f8';
    ctx.fillText('KM/H', 0, 32);

    ctx.restore();
  }
}
