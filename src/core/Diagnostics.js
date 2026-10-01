import { VEHICLE_ROSTER } from './vehicles/VehicleRoster.js';
import { TRACK_ROSTER } from './track/TrackRoster.js';

/**
 * Diagnostics & Unit Integrity Suite for μRacing engine
 */
export function runEngineSelfDiagnostics() {
  const report = {
    passed: 0,
    failed: 0,
    errors: []
  };

  function assert(condition, message) {
    if (condition) {
      report.passed++;
    } else {
      report.failed++;
      report.errors.push(message);
      console.error(`DIAGNOSTIC TEST FAILED: ${message}`);
    }
  }

  // 1. Validate all 5 cars exist and have valid physics stats
  const carKeys = Object.keys(VEHICLE_ROSTER);
  assert(carKeys.length === 5, `Expected 5 vehicles in roster, got ${carKeys.length}`);

  for (const key of carKeys) {
    const car = VEHICLE_ROSTER[key];
    assert(car.stats.topSpeed > 300, `Car ${key} topSpeed must be > 300`);
    assert(car.stats.weight > 0.5, `Car ${key} weight must be > 0.5`);
    assert(car.stats.acceleration > 200, `Car ${key} acceleration must be > 200`);
    assert(car.stats.grip > 0.5 && car.stats.grip <= 1.0, `Car ${key} grip must be between 0.5 and 1.0`);
  }

  // 2. Validate track configurations
  const trackKeys = Object.keys(TRACK_ROSTER);
  assert(trackKeys.length >= 3, `Expected at least 3 tracks, found ${trackKeys.length}`);
  for (const tKey of trackKeys) {
    const track = TRACK_ROSTER[tKey];
    assert(track.waypoints && track.waypoints.length >= 5, `Track ${tKey} must have at least 5 waypoints`);
  }

  console.info(`μRacing diagnostics complete: ${report.passed} passed, ${report.failed} failed.`);
  return report;
}
