/**
 * RubberBanding: Adjusts CPU aggression/throttle based on spatial lead or deficit to player.
 */
export class RubberBanding {
  constructor({ maxCatchup = 1.15, maxSlowdown = 0.82, targetDistance = 180 } = {}) {
    this.maxCatchup = maxCatchup;
    this.maxSlowdown = maxSlowdown;
    this.targetDistance = targetDistance;
  }

  /**
   * Calculates difficulty scalar (0.80 - 1.18) based on distance along track.
   * If AI is far behind -> boosts speed.
   * If AI is too far ahead -> softens speed.
   */
  getDifficultyScalar(playerProgressT, aiProgressT, totalSamples) {
    // Relative distance in sample units
    let diff = playerProgressT - aiProgressT;

    // Handle loop wrap
    if (diff > totalSamples / 2) diff -= totalSamples;
    if (diff < -totalSamples / 2) diff += totalSamples;

    if (diff > 5) {
      // Player is ahead: AI speeds up to catch up
      const catchupFactor = Math.min(1.0 + (diff / 30) * 0.15, this.maxCatchup);
      return catchupFactor;
    } else if (diff < -15) {
      // Player is far behind: AI slows slightly to maintain tense bumper-to-bumper racing
      const slowdownFactor = Math.max(1.0 - (Math.abs(diff) / 40) * 0.18, this.maxSlowdown);
      return slowdownFactor;
    }

    return 1.0;
  }
}
