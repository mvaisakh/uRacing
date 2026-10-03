import { Vec2 } from '../math/Vec2.js';

/**
 * SurfaceManager: Computes distance from car to track centerline spline to determine
 * whether the vehicle is on asphalt, curb, or off-track carpet/grass.
 */
export class SurfaceManager {
  constructor(splineSamples, trackHalfWidth = 70, terrainType = 'asphalt') {
    this.samples = splineSamples;
    this.trackHalfWidth = trackHalfWidth;
    this.curbHalfWidth = trackHalfWidth + 12;
    this.terrainType = terrainType; // 'asphalt' | 'mud' | 'sand' | 'dirt'
  }

  setTerrainType(type) {
    this.terrainType = type;
  }

  /**
   * Tests car position and updates car.surfaceGripMultiplier and car.surfaceType accordingly
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

    const offroadRating = (car.spec.stats && car.spec.stats.offroad) || 0.5;
    const haulingTorque = (car.spec.stats && car.spec.stats.torque) || 400;

    if (minDistance <= this.trackHalfWidth) {
      if (this.terrainType === 'mud') {
        // Deep mud track: low clearance supercars suffer heavily, 4WD SUVs & military haulers power through
        const mudPenalty = 0.42 + offroadRating * 0.56; // 0.61 for supercar (0.35), 0.97 for hauler (0.98)
        car.surfaceGripMultiplier = mudPenalty;
        car.surfaceType = 'mud';
        return 'mud';
      } else if (this.terrainType === 'sand' || this.terrainType === 'dirt') {
        // Loose sand / gravel: rewards heavy mass and tire width
        const sandGrip = 0.55 + offroadRating * 0.42;
        car.surfaceGripMultiplier = sandGrip;
        car.surfaceType = 'dirt';
        return 'dirt';
      } else {
        // Clean Asphalt
        car.surfaceGripMultiplier = 1.0;
        car.surfaceType = 'asphalt';
        return 'asphalt';
      }
    } else if (minDistance <= this.curbHalfWidth) {
      // Rough Curb / Berm
      const curbGrip = this.terrainType === 'mud' ? (0.50 + offroadRating * 0.40) : 0.85;
      car.surfaceGripMultiplier = curbGrip;
      car.surfaceType = 'curb';
      return 'curb';
    } else {
      // Off-track deep dust / thick mud / rug pile
      const offTrackGrip = 0.25 + offroadRating * 0.45;
      car.surfaceGripMultiplier = offTrackGrip;
      car.surfaceType = 'offtrack';
      return 'offtrack';
    }
  }
}
