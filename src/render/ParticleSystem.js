import { Vec2 } from '../math/Vec2.js';

/**
 * Particle & Skidmark manager for high-intensity micro-drifting
 */
export class ParticleSystem {
  constructor(maxSkidmarks = 400, maxParticles = 250) {
    this.skidmarks = [];
    this.maxSkidmarks = maxSkidmarks;

    this.particles = [];
    this.maxParticles = maxParticles;
  }

  addSkidmark(p1, p2, alpha = 0.4) {
    if (this.skidmarks.length >= this.maxSkidmarks) {
      this.skidmarks.shift();
    }
    this.skidmarks.push({
      p1: p1.clone(),
      p2: p2.clone(),
      alpha,
      life: 1.0
    });
  }

  emitSmoke(pos, baseVelocity, count = 2) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const spreadAngle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 25;
      const vel = new Vec2(
        baseVelocity.x * 0.1 + Math.cos(spreadAngle) * speed,
        baseVelocity.y * 0.1 + Math.sin(spreadAngle) * speed
      );

      this.particles.push({
        pos: pos.clone().add(new Vec2((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)),
        vel,
        radius: 2.5 + Math.random() * 2.5,
        maxRadius: 8 + Math.random() * 6,
        life: 1.0,
        decay: 1.5 + Math.random() * 1.5,
        color: '200, 205, 215'
      });
    }
  }

  update(dt) {
    // Update smoke particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.vel.scale(0.92);
      p.radius += (p.maxRadius - p.radius) * 3 * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Slowly fade oldest skidmarks
    for (let i = 0; i < this.skidmarks.length; i++) {
      this.skidmarks[i].life -= 0.015 * dt;
    }
    while (this.skidmarks.length > 0 && this.skidmarks[0].life <= 0) {
      this.skidmarks.shift();
    }
  }

  render(ctx) {
    // 1. Render Skidmarks
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (const sm of this.skidmarks) {
      ctx.strokeStyle = `rgba(18, 20, 24, ${sm.alpha * sm.life})`;
      ctx.beginPath();
      ctx.moveTo(sm.p1.x, sm.p1.y);
      ctx.lineTo(sm.p2.x, sm.p2.y);
      ctx.stroke();
    }

    // 2. Render Smoke Particles
    for (const p of this.particles) {
      ctx.fillStyle = `rgba(${p.color}, ${Math.max(0, p.life * 0.35)})`;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  clear() {
    this.skidmarks = [];
    this.particles = [];
  }
}
