import { Vec2 } from '../math/Vec2.js';
import { POWERUP_TYPES, POWERUP_LIST } from './PowerUpTypes.js';
import { DamageSystem } from '../physics/DamageSystem.js';

/**
 * PowerUpManager: Spawns pickup pods on racetrack, manages inventory, roulette,
 * projectile physics, active shields, dropped oil slicks, and blast wave collisions.
 */
export class PowerUpManager {
  constructor(splineSamples = []) {
    this.splineSamples = splineSamples;
    this.pickups = []; // Array of { id, position, respawnTimer, active }
    this.projectiles = []; // Array of active rockets { id, pos, vel, angle, shooter, life }
    this.hazards = []; // Array of dropped oil slicks { id, pos, radius, life }
    this.shockwaves = []; // Array of expanding EMP pulses { pos, radius, maxRadius, life, shooter }
    
    this._initPickups();
  }

  setSplineSamples(samples) {
    this.splineSamples = samples;
    this._initPickups();
  }

  _initPickups() {
    this.pickups = [];
    if (!this.splineSamples || this.splineSamples.length === 0) return;

    // Distribute 6-8 pickup pod clusters evenly around circuit length
    const total = this.splineSamples.length;
    const clusterCount = Math.max(5, Math.min(8, Math.floor(total / 30)));
    const step = Math.floor(total / clusterCount);

    for (let c = 0; c < clusterCount; c++) {
      const idx = (c * step + Math.floor(step / 2)) % total;
      const s = this.splineSamples[idx];
      // 2 pickup pods side-by-side across lane
      const norm = s.normal;
      [-26, 26].forEach((offset, i) => {
        this.pickups.push({
          id: `pickup_${c}_${i}`,
          position: s.point.clone().add(norm.clone().scale(offset)),
          active: true,
          respawnTimer: 0,
          rotation: Math.random() * Math.PI * 2
        });
      });
    }
  }

  update(dt, allCars = [], sounds = null, cameraShake = null) {
    // 1. Update & Respawn Pickups
    for (const p of this.pickups) {
      p.rotation += dt * 3.0; // Spin animation
      if (!p.active) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.active = true;
        }
      } else {
        // Test collision with all active cars
        for (const car of allCars) {
          if (!car.heldPowerUp && !car.isRouletteActive) {
            const dist = car.body.position.distanceTo(p.position);
            if (dist < (car.width || 18) * 1.2 + 16) {
              p.active = false;
              p.respawnTimer = 6.0; // 6 second respawn cooldown
              this._startRoulette(car);
              break;
            }
          }
        }
      }
    }

    // 2. Update Roulette / Inventory timers for each car
    for (const car of allCars) {
      if (car.isRouletteActive) {
        car.rouletteTimer -= dt;
        if (car.rouletteTimer <= 0) {
          car.isRouletteActive = false;
          // Randomly select power-up
          const pick = POWERUP_LIST[Math.floor(Math.random() * POWERUP_LIST.length)];
          car.heldPowerUp = pick;
        }
      }

      // Update Shield Timer
      if (car.shieldActive) {
        car.shieldTimer -= dt;
        if (car.shieldTimer <= 0) {
          car.shieldActive = false;
        }
      }

      // Update Boost Timer
      if (car.boostActive) {
        car.boostTimer -= dt;
        const heading = Vec2.fromAngle(car.body.angle);
        car.body.applyForce(heading.scale(car.spec.stats.acceleration * 2.4));
        if (car.boostTimer <= 0) {
          car.boostActive = false;
        }
      }

      // Update Spinout Timer
      if (car.spinoutTimer > 0) {
        car.spinoutTimer -= dt;
        car.body.angularVelocity += 16 * dt; // rapid 360 spin
        car.body.velocity.scale(0.94); // heavy deceleration
      }

      // Update EMP Stun Timer
      if (car.stunTimer > 0) {
        car.stunTimer -= dt;
        car.body.velocity.scale(0.96);
      }
    }

    // 3. Update Rockets / Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.pos.add(proj.vel.clone().scale(dt));

      // Optional slight homing toward nearest rival ahead
      let bestTarget = null;
      let bestDist = 280;
      for (const car of allCars) {
        if (car !== proj.shooter) {
          const d = proj.pos.distanceTo(car.body.position);
          if (d < bestDist) {
            const toTarget = car.body.position.clone().sub(proj.pos).normalize();
            const projDir = proj.vel.clone().normalize();
            if (projDir.dot(toTarget) > 0.4) {
              bestDist = d;
              bestTarget = car;
            }
          }
        }
      }

      if (bestTarget) {
        const toTarget = bestTarget.body.position.clone().sub(proj.pos).normalize();
        const curDir = proj.vel.clone().normalize();
        const newDir = curDir.lerp(toTarget, 4.0 * dt).normalize();
        const spd = proj.vel.length();
        proj.vel = newDir.scale(spd);
        proj.angle = Math.atan2(newDir.y, newDir.x);
      }

      // Hit detection against all cars
      let hitCar = null;
      for (const car of allCars) {
        if (car !== proj.shooter) {
          const d = proj.pos.distanceTo(car.body.position);
          if (d < (car.width || 18) * 1.1 + 8) {
            hitCar = car;
            break;
          }
        }
      }

      if (hitCar) {
        if (!hitCar.shieldActive) {
          // Explosive damage and angular push
          DamageSystem.applyDamage(hitCar, 260, proj.pos, 0.08);
          hitCar.spinoutTimer = 0.9;
          const blastDir = hitCar.body.position.clone().sub(proj.pos).normalize();
          hitCar.body.velocity.add(blastDir.scale(220));
          if (cameraShake) cameraShake.addTrauma(0.45);
        } else {
          // Shield deflects rocket
          hitCar.shieldActive = false; // Shield breaks
          if (cameraShake) cameraShake.addTrauma(0.15);
        }
        if (sounds && sounds.playImpactSound) sounds.playImpactSound(400);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Update Hazards (Oil Slicks)
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const haz = this.hazards[i];
      haz.life -= dt;

      // Check collision with cars
      for (const car of allCars) {
        if (car.spinoutTimer <= 0) {
          const d = car.body.position.distanceTo(haz.pos);
          if (d < haz.radius + (car.width || 18) * 0.5) {
            if (!car.shieldActive) {
              car.spinoutTimer = 1.2; // 360 spin slip
              DamageSystem.applyDamage(car, 120, haz.pos, 0.04);
              if (sounds && sounds.playImpactSound) sounds.playImpactSound(150);
            } else {
              car.shieldActive = false;
            }
          }
        }
      }

      if (haz.life <= 0) {
        this.hazards.splice(i, 1);
      }
    }

    // 5. Update EMP Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 10 * dt;
      sw.life -= dt;

      for (const car of allCars) {
        if (car !== sw.shooter && car.stunTimer <= 0) {
          const d = car.body.position.distanceTo(sw.pos);
          if (Math.abs(d - sw.radius) < 28) {
            if (!car.shieldActive) {
              car.stunTimer = 1.8; // Motor cut out for 1.8s
              DamageSystem.applyDamage(car, 140, sw.pos, 0.03);
            } else {
              car.shieldActive = false;
            }
          }
        }
      }

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  _startRoulette(car) {
    car.isRouletteActive = true;
    car.rouletteTimer = 1.2; // 1.2s spinning slot animation
    car.heldPowerUp = null;
  }

  usePowerUp(car, allCars = [], sounds = null, cameraShake = null) {
    if (!car || !car.heldPowerUp || car.isRouletteActive) return false;

    const pType = car.heldPowerUp;
    car.heldPowerUp = null; // Consume item

    const heading = Vec2.fromAngle(car.body.angle);
    const pos = car.body.position;

    switch (pType) {
      case 'ROCKET': {
        const spawnPos = pos.clone().add(heading.clone().scale((car.length || 34) * 0.6 + 12));
        const rocketSpeed = Math.max(580, car.forwardVelocity + 420);
        this.projectiles.push({
          id: `rocket_${Date.now()}`,
          pos: spawnPos,
          vel: heading.clone().scale(rocketSpeed),
          angle: car.body.angle,
          shooter: car,
          life: 2.8
        });
        if (sounds && sounds.playNitroWhoosh) sounds.playNitroWhoosh();
        if (cameraShake) cameraShake.addTrauma(0.15);
        break;
      }
      case 'OIL_SLICK': {
        const dropPos = pos.clone().sub(heading.clone().scale((car.length || 34) * 0.6 + 10));
        this.hazards.push({
          id: `oil_${Date.now()}`,
          pos: dropPos,
          radius: 22,
          life: 14.0 // lasts 14 seconds
        });
        break;
      }
      case 'EMP_SHOCK': {
        this.shockwaves.push({
          pos: pos.clone(),
          radius: 10,
          maxRadius: 210,
          life: 0.65,
          shooter: car
        });
        if (cameraShake) cameraShake.addTrauma(0.25);
        break;
      }
      case 'FORCE_SHIELD': {
        car.shieldActive = true;
        car.shieldTimer = 7.0; // 7 seconds duration
        break;
      }
      case 'HYPER_BOOST': {
        car.boostActive = true;
        car.boostTimer = 3.0;
        if (sounds && sounds.playNitroWhoosh) sounds.playNitroWhoosh();
        if (cameraShake) cameraShake.addTrauma(0.25);
        break;
      }
      case 'MAGNET': {
        // Find nearest rival in front of car
        let leadCar = null;
        let leadDist = 550;
        for (const other of allCars) {
          if (other !== car) {
            const toOther = other.body.position.clone().sub(pos);
            const dist = toOther.length();
            if (dist < leadDist && heading.dot(toOther.normalize()) > 0.4) {
              leadDist = dist;
              leadCar = other;
            }
          }
        }
        if (leadCar) {
          const pullDir = leadCar.body.position.clone().sub(pos).normalize();
          car.body.velocity.add(pullDir.scale(320));
          car.forwardVelocity = Math.max(car.forwardVelocity, car.spec.stats.topSpeed * 1.15);
        } else {
          // Fallback slingshot boost if no leader ahead
          car.body.velocity.add(heading.scale(260));
        }
        if (cameraShake) cameraShake.addTrauma(0.2);
        break;
      }
    }

    return true;
  }

  renderHUD(ctx, screenX, screenY, car) {
    if (!car) return;

    const boxW = 88;
    const boxH = 46;

    ctx.save();
    // Glassmorphic item frame
    ctx.fillStyle = 'rgba(10, 15, 24, 0.85)';
    ctx.strokeStyle = car.heldPowerUp ? '#00f2fe' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    
    // Draw rounded rect
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(screenX + r, screenY);
    ctx.lineTo(screenX + boxW - r, screenY);
    ctx.quadraticCurveTo(screenX + boxW, screenY, screenX + boxW, screenY + r);
    ctx.lineTo(screenX + boxW, screenY + boxH - r);
    ctx.quadraticCurveTo(screenX + boxW, screenY + boxH, screenX + boxW - r, screenY + boxH);
    ctx.lineTo(screenX + r, screenY + boxH);
    ctx.quadraticCurveTo(screenX, screenY + boxH, screenX, screenY + boxH - r);
    ctx.lineTo(screenX, screenY + r);
    ctx.quadraticCurveTo(screenX, screenY, screenX + r, screenY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top item label
    ctx.fillStyle = '#8395a7';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ITEM [E]', screenX + boxW / 2, screenY + 12);

    if (car.isRouletteActive) {
      // Spinning slot animation
      const rouletteIcons = ['🚀', '🛢️', '⚡', '🛡️', '🔥', '🧲'];
      const slotIdx = Math.floor(Date.now() / 90) % rouletteIcons.length;
      ctx.font = '18px sans-serif';
      ctx.fillText(rouletteIcons[slotIdx], screenX + boxW / 2, screenY + 34);
    } else if (car.heldPowerUp) {
      const def = POWERUP_TYPES[car.heldPowerUp];
      if (def) {
        ctx.font = '18px sans-serif';
        ctx.fillText(def.icon, screenX + boxW / 2 - 14, screenY + 34);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = def.color || '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(def.name.split(' ')[0].toUpperCase(), screenX + boxW / 2 + 3, screenY + 32);
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('EMPTY', screenX + boxW / 2, screenY + 32);
    }

    ctx.restore();
  }
}
