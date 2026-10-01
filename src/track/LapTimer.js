/**
 * LapTimer: Accurate delta-time based millisecond lap timing and record calculation.
 */
export class LapTimer {
  constructor() {
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.lapTimes = [];
    this.bestLapTime = null;
    this.lastLapTime = null;
    this.isRunning = false;
  }

  start() {
    this.reset();
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  reset() {
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.lapTimes = [];
    this.bestLapTime = null;
    this.lastLapTime = null;
    this.isRunning = false;
  }

  update(dt) {
    if (!this.isRunning) return;
    this.currentLapTime += dt;
    this.totalRaceTime += dt;
  }

  recordLap() {
    this.lastLapTime = this.currentLapTime;
    this.lapTimes.push(this.lastLapTime);

    let isNewBest = false;
    if (this.bestLapTime === null || this.lastLapTime < this.bestLapTime) {
      this.bestLapTime = this.lastLapTime;
      isNewBest = true;
    }

    this.currentLapTime = 0;
    return {
      lastLapTime: this.lastLapTime,
      bestLapTime: this.bestLapTime,
      isNewBest
    };
  }

  static formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.---';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (n, width = 2) => String(n).padStart(width, '0');
    return `${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  }
}
