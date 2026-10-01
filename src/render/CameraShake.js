import { Vec2 } from '../math/Vec2.js';

/**
 * CameraShake: High-frequency decay camera shake on crashes and nitro bursts.
 */
export class CameraShake {
  constructor() {
    this.trauma = 0; // [0, 1]
    this.decay = 1.4; // Decay rate per second
    this.maxOffset = 18;
    this.maxRoll = 0.04;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * dt);
    }
  }

  getOffset() {
    if (this.trauma === 0) return { x: 0, y: 0, angle: 0 };
    // Non-linear trauma curve (trauma^2)
    const shake = this.trauma * this.trauma;
    const x = (Math.random() * 2 - 1) * this.maxOffset * shake;
    const y = (Math.random() * 2 - 1) * this.maxOffset * shake;
    const angle = (Math.random() * 2 - 1) * this.maxRoll * shake;
    return { x, y, angle };
  }
}
