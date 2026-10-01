import { Vec2 } from '../math/Vec2.js';

/**
 * CheckpointGate: Line segment gate across track.
 * Requires vehicle to cross in the correct forward direction.
 */
export class CheckpointGate {
  constructor(index, center, normal, halfWidth) {
    this.index = index;
    this.center = center;
    this.normal = normal; // Forward normal (direction of race)
    this.p1 = center.clone().sub(new Vec2(-normal.y, normal.x).scale(halfWidth));
    this.p2 = center.clone().add(new Vec2(-normal.y, normal.x).scale(halfWidth));
  }

  /**
   * Tests if car traversed the segment between lastPos and currentPos in forward direction
   */
  hasCrossed(lastPos, currentPos) {
    // 1. Line segment intersection between (lastPos -> currentPos) and (p1 -> p2)
    const x1 = lastPos.x;
    const y1 = lastPos.y;
    const x2 = currentPos.x;
    const y2 = currentPos.y;

    const x3 = this.p1.x;
    const y3 = this.p1.y;
    const x4 = this.p2.x;
    const y4 = this.p2.y;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      // 2. Validate forward direction: motion dot normal > 0
      const motion = currentPos.clone().sub(lastPos);
      return motion.dot(this.normal) > 0;
    }
    return false;
  }
}

/**
 * CheckpointSystem: Sequence manager for full circuit lap validation.
 */
export class CheckpointSystem {
  constructor(splineSamples, trackHalfWidth = 70, gateCount = 8) {
    this.gates = [];
    this.totalSamples = splineSamples.length;
    const step = Math.floor(this.totalSamples / gateCount);

    for (let i = 0; i < gateCount; i++) {
      const sample = splineSamples[i * step];
      // Note: sample.tangent is forward direction
      this.gates.push(new CheckpointGate(i, sample.point, sample.tangent, trackHalfWidth));
    }
  }

  createTracker() {
    return {
      nextGateIndex: 1, // 0 is start/finish line
      completedLaps: 0,
      lastPosition: null,
      lapValid: true
    };
  }

  updateTracker(tracker, carPos, onLapComplete = null) {
    if (!tracker.lastPosition) {
      tracker.lastPosition = carPos.clone();
      return;
    }

    const currentTargetGate = this.gates[tracker.nextGateIndex];
    if (currentTargetGate && currentTargetGate.hasCrossed(tracker.lastPosition, carPos)) {
      tracker.nextGateIndex = (tracker.nextGateIndex + 1) % this.gates.length;

      // Crossed gate 0 means a completed lap (if all previous gates were validated)
      if (tracker.nextGateIndex === 1) {
        tracker.completedLaps++;
        if (onLapComplete) {
          onLapComplete(tracker.completedLaps);
        }
      }
    }

    tracker.lastPosition.copy(carPos);
  }

  render(ctx) {
    // Debug rendering of gates
    ctx.lineWidth = 1.5;
    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i];
      ctx.strokeStyle = i === 0 ? 'rgba(46, 204, 113, 0.6)' : 'rgba(52, 152, 219, 0.3)';
      ctx.beginPath();
      ctx.moveTo(g.p1.x, g.p1.y);
      ctx.lineTo(g.p2.x, g.p2.y);
      ctx.stroke();
    }
  }
}
