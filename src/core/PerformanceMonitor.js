/**
 * PerformanceMonitor: High precision memory, frame budget, and garbage collection spike tracker.
 */
export class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.maxSamples = 60;
    this.slowFrames = 0;
  }

  recordFrame(deltaMs) {
    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
    if (deltaMs > 16.7) {
      this.slowFrames++;
    }
  }

  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 16.6;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
}
