/**
 * GameLoop: Standard fixed-update / variable-render loop with delta-time.
 */
export class GameLoop {
  /**
   * @param {Object} options
   * @param {(dt: number) => void} options.update
   * @param {(interpolation: number) => void} options.render
   * @param {number} [options.targetFps=60]
   */
  constructor({ update, render, targetFps = 60 }) {
    this.update = update;
    this.render = render;
    this.step = 1 / targetFps;
    this.maxAccumulator = 0.25; // prevent spiral of death

    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = null;
    this.running = false;
    this.fps = 0;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = 0;

    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.framesThisSecond = 0;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _tick(currentTime) {
    if (!this.running) return;

    let delta = (currentTime - this.lastTime) / 1000;
    if (delta > this.maxAccumulator) {
      delta = this.maxAccumulator;
    }
    this.lastTime = currentTime;
    this.accumulator += delta;

    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }

    const interpolation = this.accumulator / this.step;
    this.render(interpolation);

    this.framesThisSecond++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.framesThisSecond;
      this.framesThisSecond = 0;
      this.lastFpsUpdate = currentTime;
    }

    this.rafId = requestAnimationFrame(this._tick);
  }
}
