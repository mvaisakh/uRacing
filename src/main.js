import { GameLoop } from './core/GameLoop.js';
import { StorageService } from './fs/StorageService.js';
import { InputHandler } from './input/InputHandler.js';
import { GameState } from './core/GameState.js';
import { VEHICLE_ROSTER } from './vehicles/VehicleRoster.js';
import { Car } from './vehicles/Car.js';
import { Camera2D } from './render/Camera2D.js';
import { VehicleRenderer } from './render/VehicleRenderer.js';
import { ParticleSystem } from './render/ParticleSystem.js';
import { Vec2 } from './math/Vec2.js';
import { CatmullRomSpline } from './track/Spline.js';
import { TrackRibbon } from './track/TrackRibbon.js';
import { TrackBarriers } from './track/TrackBarriers.js';
import { SurfaceManager } from './track/SurfaceManager.js';
import { TRACK_ROSTER } from './track/TrackRoster.js';
import { CheckpointSystem } from './track/CheckpointSystem.js';
import { LapTimer } from './track/LapTimer.js';
import { AIController } from './ai/AIController.js';
import { RubberBanding } from './ai/RubberBanding.js';
import { CollisionSystem } from './physics/CollisionSystem.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Fatal: Failed to locate game-canvas element.');
    return;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  const ctx = canvas.getContext('2d');
  const storage = new StorageService('uracing');
  const gameState = new GameState(storage);
  const input = new InputHandler();
  const camera = new Camera2D(canvas.width, canvas.height);
  const particles = new ParticleSystem();

  window.addEventListener('resize', () => {
    resizeCanvas();
    camera.resize(canvas.width, canvas.height);
  });

  // Track setup (Kitchen Countertop Grand Prix)
  const trackConfig = TRACK_ROSTER.kitchen_countertop;
  const spline = new CatmullRomSpline(trackConfig.waypoints, true);
  const splineSamples = spline.sampleEvenly(12);
  const trackRibbon = new TrackRibbon(splineSamples, trackConfig.trackWidth);
  const trackBarriers = new TrackBarriers(trackRibbon);
  const surfaceManager = new SurfaceManager(splineSamples, trackConfig.trackWidth / 2);
  const checkpointSystem = new CheckpointSystem(splineSamples, trackConfig.trackWidth / 2, 8);
  const lapTimer = new LapTimer();
  const rubberBanding = new RubberBanding();

  // 1. Player Vehicle setup
  const playerSpec = VEHICLE_ROSTER[gameState.profile.selectedCar] || VEHICLE_ROSTER.detroit_bruiser;
  const playerCar = new Car(playerSpec);
  const playerTracker = checkpointSystem.createTracker();

  // 2. AI Opponent Vehicle setup (Tokyo Drift-King)
  const aiSpec = VEHICLE_ROSTER.tokyo_drift_king;
  const aiCar = new Car(aiSpec);
  const aiController = new AIController(aiCar, splineSamples, 0.45);
  const aiTracker = checkpointSystem.createTracker();

  function resetRace() {
    const startPt = splineSamples[0].point;
    const startTangent = splineSamples[0].tangent;
    const startNormal = splineSamples[0].normal;
    const startAngle = startTangent.angle();

    // Stagger start grid positions
    const p1Pos = startPt.clone().add(startNormal.clone().scale(-20));
    const aiPos = startPt.clone().add(startNormal.clone().scale(20)).sub(startTangent.clone().scale(50));

    playerCar.reset(p1Pos.x, p1Pos.y, startAngle);
    aiCar.reset(aiPos.x, aiPos.y, startAngle);

    lapTimer.start();
    playerTracker.nextGateIndex = 1;
    playerTracker.completedLaps = 0;
    aiTracker.nextGateIndex = 1;
    aiTracker.completedLaps = 0;
    particles.clear();
  }

  resetRace();

  let prevPlayerWheelPos = null;
  let prevAiWheelPos = null;

  const loop = new GameLoop({
    update: (dt) => {
      const controls = input.getControls();
      if (controls.reset) {
        resetRace();
      }

      // 1. Evaluate surface friction
      surfaceManager.evaluateSurface(playerCar);
      surfaceManager.evaluateSurface(aiCar);

      // 2. AI Dynamic difficulty rubber-banding
      const aiDiff = rubberBanding.getDifficultyScalar(
        playerTracker.nextGateIndex * 15,
        aiTracker.nextGateIndex * 15,
        splineSamples.length
      );
      const aiControls = aiController.update(dt, aiDiff);

      // 3. Update physics
      playerCar.update(controls, dt);
      aiCar.update(aiControls, dt);

      // 4. Resolve barrier collisions
      for (const barrier of trackBarriers.getBarriers()) {
        CollisionSystem.resolveCarBarrier(playerCar, barrier);
        CollisionSystem.resolveCarBarrier(aiCar, barrier);
      }

      // 5. Update Lap checkpoints and timing
      lapTimer.update(dt);
      checkpointSystem.updateTracker(playerTracker, playerCar.body.position, (laps) => {
        const result = lapTimer.recordLap();
        if (result.isNewBest) {
          gameState.recordLapTime(trackConfig.id, result.bestLapTime);
        }
      });
      checkpointSystem.updateTracker(aiTracker, aiCar.body.position);

      // 6. Camera smooth follow player
      camera.follow(playerCar.body.position, playerCar.body.velocity, dt);

      // 7. Skidmarks & tire smoke emission
      const emitTireEffects = (car, prev) => {
        const heading = Vec2.fromAngle(car.body.angle);
        const right = new Vec2(-heading.y, heading.x);
        const rearAxle = car.body.position.clone().sub(heading.clone().scale(car.length * 0.45));
        const leftRear = rearAxle.clone().add(right.clone().scale(-car.width * 0.4));
        const rightRear = rearAxle.clone().add(right.clone().scale(car.width * 0.4));

        if (car.isDrifting) {
          if (prev) {
            particles.addSkidmark(prev.left, leftRear, 0.3);
            particles.addSkidmark(prev.right, rightRear, 0.3);
          }
          particles.emitSmoke(rearAxle, car.body.velocity, 2);
        }
        return { left: leftRear, right: rightRear };
      };

      prevPlayerWheelPos = emitTireEffects(playerCar, prevPlayerWheelPos);
      prevAiWheelPos = emitTireEffects(aiCar, prevAiWheelPos);
      particles.update(dt);
    },

    render: (interp) => {
      ctx.fillStyle = trackConfig.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      camera.begin(ctx);

      // Draw Cutting Mat/Floor grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 120;
      const startX = Math.floor((camera.position.x - canvas.width / camera.zoom) / gridSize) * gridSize;
      const endX = Math.ceil((camera.position.x + canvas.width / camera.zoom) / gridSize) * gridSize;
      const startY = Math.floor((camera.position.y - canvas.height / camera.zoom) / gridSize) * gridSize;
      const endY = Math.ceil((camera.position.y + canvas.height / camera.zoom) / gridSize) * gridSize;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
      ctx.restore();

      // Render Track & Barrier rails
      trackRibbon.render(ctx);
      trackBarriers.render(ctx);

      // Render Tire Skidmarks & smoke
      particles.render(ctx);

      // Render Vehicles
      VehicleRenderer.render(ctx, aiCar);
      VehicleRenderer.render(ctx, playerCar);

      camera.end(ctx);

      // --- Screen Space HUD ---
      ctx.fillStyle = 'rgba(15, 20, 26, 0.85)';
      ctx.fillRect(16, 16, 280, 130);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, 280, 130);

      ctx.fillStyle = '#4ae3b5';
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillText(`μRACING // ${trackConfig.name.toUpperCase()}`, 28, 40);

      ctx.fillStyle = '#e0e6ed';
      ctx.font = '13px monospace';
      ctx.fillText(`LAP: ${playerTracker.completedLaps + 1} / ${trackConfig.laps}`, 28, 64);
      ctx.fillText(`TIME: ${LapTimer.formatTime(lapTimer.currentLapTime)}`, 28, 86);
      ctx.fillText(`BEST: ${LapTimer.formatTime(lapTimer.bestLapTime)}`, 28, 108);

      const speedKm = Math.round(playerCar.forwardVelocity * 0.45);
      ctx.fillStyle = playerCar.surfaceGripMultiplier < 0.8 ? '#e74c3c' : '#4ae3b5';
      ctx.fillText(`SPEED: ${speedKm} km/h ${playerCar.surfaceGripMultiplier < 0.8 ? ' [OFF-TRACK]' : ''}`, 28, 130);
    }
  });

  loop.start();
  console.info('μRacing full circuit, checkpoints, AI opponent, and physics running.');
});
