import { Vec2 } from '../math/Vec2.js';

/**
 * SurfaceManager: Computes distance from car to track centerline spline to determine
 * whether the vehicle is on asphalt, curb, or off-track carpet/grass.
 */
export class SurfaceManager {
  constructor(splineSamples, trackHalfWidth = 70) {
    this.samples = splineSamples;
    this.trackHalfWidth = trackHalfWidth;
    this.curbHalfWidth = trackHalfWidth + 12;
  }

  /**
   * Tests car position and updates car.surfaceGripMultiplier accordingly
   */
  evaluateSurface(car) {
    const pos = car.body.position;
    let minDistance = Infinity;

    // Fast search nearest spline sample
    for (let i = 0; i < this.samples.length; i++) {
      const d = pos.distanceTo(this.samples[i].point);
      if (d < minDistance) {
        minDistance = d;
      }
    }

    if (minDistance <= this.trackHalfWidth) {
      // Clean Asphalt
      car.surfaceGripMultiplier = 1.0;
      return 'asphalt';
    } else if (minDistance <= this.curbHalfWidth) {
      // Rough Curb (slight rumble and friction loss)
      car.surfaceGripMultiplier = 0.85;
      return 'curb';
    } else {
      // Off-track Grass / Carpet / Floor dust (heavy friction penalty)
      car.surfaceGripMultiplier = 0.40;
      return 'offtrack';
    }
  }
}
