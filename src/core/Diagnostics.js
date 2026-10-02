import { VEHICLE_ROSTER } from '../vehicles/VehicleRoster.js';
import { TRACK_ROSTER } from '../track/TrackRoster.js';

/**
 * Diagnostics & Debug HUD overlay for μRacing engine.
 * Press F1 or `~` to toggle the live diagnostics panel anytime.
 */
export class EngineDiagnostics {
  constructor() {
    this.visible = false;
    this.report = null;
    this.logs = [];
    this.maxLogs = 8;

    this.runSelfTest();
    this._attachKeyHandler();
  }

  _attachKeyHandler() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F1' || e.code === 'Backquote') {
        this.visible = !this.visible;
        this.log(`Diagnostics overlay ${this.visible ? 'enabled' : 'disabled'}`);
      }
    });
  }

  log(msg) {
    const time = new Date().toTimeString().split(' ')[0];
    this.logs.unshift(`[${time}] ${msg}`);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    console.info(`[μRacing Diag] ${msg}`);
  }

  runSelfTest() {
    const report = {
      passed: 0,
      failed: 0,
      errors: []
    };

    const assert = (condition, message) => {
      if (condition) {
        report.passed++;
      } else {
        report.failed++;
        report.errors.push(message);
        console.error(`[DIAG ERROR] ${message}`);
      }
    };

    // 1. Validate vehicle roster (expanded 16-car multi-class roster)
    const carKeys = Object.keys(VEHICLE_ROSTER);
    assert(carKeys.length >= 15, `Expected >= 15 vehicles in roster, got ${carKeys.length}`);
    for (const key of carKeys) {
      const car = VEHICLE_ROSTER[key];
      assert(!!car.name, `Car ${key} must have a name`);
      assert(car.stats.topSpeed >= 300, `Car ${key} topSpeed must be >= 300`);
      assert(car.stats.weight >= 0.5, `Car ${key} weight must be >= 0.5`);
      assert(car.stats.acceleration >= 200, `Car ${key} acceleration must be >= 200`);
      assert(car.stats.grip > 0.5 && car.stats.grip <= 1.0, `Car ${key} grip in range`);
    }

    // 2. Validate tracks
    const trackKeys = Object.keys(TRACK_ROSTER);
    assert(trackKeys.length >= 3, `Expected >= 3 tracks, found ${trackKeys.length}`);
    for (const tKey of trackKeys) {
      const track = TRACK_ROSTER[tKey];
      assert(track.waypoints && track.waypoints.length >= 5, `Track ${tKey} waypoints count`);
      assert(track.trackWidth >= 80, `Track ${tKey} trackWidth >= 80`);
    }

    this.report = report;
    this.log(`Self-test passed ${report.passed}/${report.passed + report.failed} checks`);
    return report;
  }

  render(ctx, width, height, runtimeData = {}) {
    if (!this.visible) {
      // Small prompt in top-right corner indicating diagnostics availability
      ctx.save();
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('[F1 / ~] DIAGNOSTICS', width - 20, 18);
      ctx.restore();
      return;
    }

    const panelW = 380;
    const panelH = 340;
    const panelX = width - panelW - 20;
    const panelY = 20;

    ctx.save();
    // Glassmorphic panel background
    ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1.5;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title bar
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ μRACING ENGINE DIAGNOSTICS [F1]', panelX + 16, panelY + 24);

    // Self-test summary
    const statusColor = this.report.failed === 0 ? '#2ecc71' : '#e74c3c';
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`INTEGRITY: ${this.report.passed} PASSED / ${this.report.failed} FAILED`, panelX + 16, panelY + 46);

    // Runtime engine stats
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '11px monospace';
    let y = panelY + 70;

    const stats = [
      `FPS: ${runtimeData.fps ?? 60} (Target: 60)`,
      `Screen State: ${runtimeData.currentScreen ?? 'UNKNOWN'}`,
      `Active Car: ${runtimeData.carName ?? 'None'}`,
      `Track: ${runtimeData.trackName ?? 'None'}`,
      `Audio Synthesizer: ${runtimeData.audioActive ? 'RUNNING' : 'AWAITING USER GESTURE'}`,
      `Canvas Res: ${width}x${height} (DPR: ${window.devicePixelRatio || 1})`,
      `Active Particles: ${runtimeData.particleCount ?? 0}`,
      `Barrier Segments: ${runtimeData.barrierCount ?? 0}`
    ];

    for (const stat of stats) {
      ctx.fillText(stat, panelX + 16, y);
      y += 18;
    }

    // Real-time Event Log
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('EVENT STREAM:', panelX + 16, y + 10);
    y += 26;

    ctx.fillStyle = '#8ab4f8';
    ctx.font = '10px monospace';
    for (const line of this.logs) {
      ctx.fillText(line, panelX + 16, y);
      y += 14;
    }

    ctx.restore();
  }
}
