/**
 * NitroSystem: Micro nitro boost charges for high-stakes overtaking maneuvers.
 */
export class NitroSystem {
  constructor(maxCharges = 3, rechargeRate = 0.08) {
    this.maxCharges = maxCharges;
    this.rechargeRate = rechargeRate;
    this.charge = maxCharges;
    this.isActive = false;
    this.burnDuration = 1.2;
    this.currentBurn = 0;
  }

  trigger() {
    if (this.charge >= 1.0 && !this.isActive) {
      this.charge -= 1.0;
      this.isActive = true;
      this.currentBurn = this.burnDuration;
      return true;
    }
    return false;
  }

  update(dt, car) {
    if (this.isActive) {
      this.currentBurn -= dt;
      // Inject 60% boost acceleration impulse
      const heading = car.body.velocity.clone().normalize();
      car.body.applyForce(heading.scale(car.spec.stats.acceleration * 1.6));

      if (this.currentBurn <= 0) {
        this.isActive = false;
      }
    } else {
      if (this.charge < this.maxCharges) {
        this.charge = Math.min(this.maxCharges, this.charge + this.rechargeRate * dt);
      }
    }
  }

  renderHUD(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('NITRO BOOST [SHIFT]', x, y);

    for (let i = 0; i < this.maxCharges; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x + i * 28, y + 6, 24, 6);

      const fill = Math.min(1.0, Math.max(0, this.charge - i));
      if (fill > 0) {
        ctx.fillStyle = '#00f2fe';
        ctx.fillRect(x + i * 28, y + 6, 24 * fill, 6);
      }
    }
    ctx.restore();
  }
}
