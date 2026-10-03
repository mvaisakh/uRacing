/**
 * DamageSystem: Handles vehicle structural health, armor damage mitigation,
 * impact deformation tracking, and performance degradation.
 */
export class DamageSystem {
  static MAX_HEALTH = 100;

  /**
   * Applies collision impact damage to a vehicle.
   * @param {Car} car 
   * @param {number} impactSpeed - speed or relative closing velocity of impact
   * @param {Vec2|null} contactPoint - world space contact point
   * @param {number} baseDamageFactor - sensitivity scalar
   * @returns {number} actual damage dealt
   */
  static applyDamage(car, impactSpeed, contactPoint = null, baseDamageFactor = 0.05) {
    if (!car || impactSpeed < 75) return 0; // Ignore low-speed paint scrapes below threshold

    // Armor factor: heavier vehicles & SUVs take significantly less structural damage
    // Weight ranges from ~0.9 to 2.25
    const armorRating = (car.spec && car.spec.stats && car.spec.stats.weight) ? car.spec.stats.weight : 1.0;
    const armorMultiplier = 1.0 / Math.max(0.6, armorRating);

    // Calculate raw damage: scales linearly above threshold
    const excessSpeed = impactSpeed - 75;
    const rawDamage = excessSpeed * baseDamageFactor * armorMultiplier;
    const damage = Math.min(35, Math.max(2, rawDamage)); // Cap single collision blow

    car.health = Math.max(0, car.health - damage);

    // Record deformation event for 3D mesh denting
    if (contactPoint) {
      if (!car.impactEvents) car.impactEvents = [];
      car.impactEvents.push({
        worldPos: { x: contactPoint.x, y: contactPoint.y },
        intensity: Math.min(1.0, damage / 20),
        time: Date.now()
      });
    }

    return damage;
  }

  /**
   * Returns performance penalty scalar based on health.
   * At 100 HP -> 1.0 (no penalty)
   * At 0 HP   -> 0.70 top speed & 0.65 acceleration (limp home mode)
   */
  static getPerformanceScalar(car) {
    const healthRatio = (car.health !== undefined ? car.health : DamageSystem.MAX_HEALTH) / DamageSystem.MAX_HEALTH;
    return 0.70 + 0.30 * healthRatio;
  }
}
