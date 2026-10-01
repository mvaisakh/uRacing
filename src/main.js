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
import { CarVsCarCollision } from './physics/CarVsCarCollision.js';
import { PropManager } from './world/PropManager.js';
import { SoundSystem } from './audio/SoundSystem.js';
import { Minimap } from './render/Minimap.js';
import { SpeedometerHUD } from './render/SpeedometerHUD.js';
import { RaceManager } from './core/RaceManager.js';
import { GarageUI } from './ui/GarageUI.js';
import { TrackSelectUI } from './ui/TrackSelectUI.js';
import { ControlsOverlay } from './ui/ControlsOverlay.js';

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
  const sounds = new SoundSystem();
  const speedometer = new SpeedometerHUD(130);

  // User gesture interaction unlocks Web Audio
  const unlockAudio = () => {
    sounds.init();
    sounds.resume();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('click', unlockAudio);

  window.addEventListener('resize', () => {
    resizeCanvas();
    camera.resize(canvas.width, canvas.height);
  });

  // Screen Modes: 'GARAGE', 'TRACK_SELECT', 'RACE'
  let currentScreen = 'GARAGE';

  let currentTrackKey = 'kitchen_countertop';
  let trackConfig = TRACK_ROSTER[currentTrackKey];
  let spline = new CatmullRomSpline(trackConfig.waypoints, true);
  let splineSamples = spline.sampleEvenly(12);
  let trackRibbon = new TrackRibbon(splineSamples, trackConfig.trackWidth);
  let trackBarriers = new TrackBarriers(trackRibbon);
  let surfaceManager = new SurfaceManager(splineSamples, trackConfig.trackWidth / 2);
  let checkpointSystem = new CheckpointSystem(splineSamples, trackConfig.trackWidth / 2, 8);
  let lapTimer = new LapTimer();
  let rubberBanding = new RubberBanding();
  let propManager = new PropManager(trackConfig.environment);
  let minimap = new Minimap(splineSamples, 170);

  let playerCar = null;
  let playerTracker = null;
  let aiCar = null;
  let aiController = null;
  let aiTracker = null;

  const raceManager = new RaceManager({
    totalLaps: trackConfig.laps,
    onRaceFinish: (winner, coins) => {
      // Awarded in RaceManager
    }
  });

  function setupTrack(trackId) {
    currentTrackKey = trackId;
    trackConfig = TRACK_ROSTER[trackId];
    spline = new CatmullRomSpline(trackConfig.waypoints, true);
    splineSamples = spline.sampleEvenly(12);
    trackRibbon = new TrackRibbon(splineSamples, trackConfig.trackWidth);
    trackBarriers = new TrackBarriers(trackRibbon);
    surfaceManager = new SurfaceManager(splineSamples, trackConfig.trackWidth / 2);
    checkpointSystem = new CheckpointSystem(splineSamples, trackConfig.trackWidth / 2, 8);
    propManager = new PropManager(trackConfig.environment);
    minimap = new Minimap(splineSamples, 170);
    raceManager.totalLaps = trackConfig.laps;
  }

  function startRaceSession() {
    const playerSpec = VEHICLE_ROSTER[gameState.profile.selectedCar] || VEHICLE_ROSTER.detroit_bruiser;
    playerCar = new Car(playerSpec);
    playerTracker = checkpointSystem.createTracker();

    // Pick a rival car
    const rivals = Object.keys(VEHICLE_ROSTER).filter(k => k !== gameState.profile.selectedCar);
    const rivalKey = rivals[Math.floor(Math.random() * rivals.length)] || 'tokyo_drift_king';
    const aiSpec = VEHICLE_ROSTER[rivalKey];
    aiCar = new Car(aiSpec);
    aiController = new AIController(aiCar, splineSamples, 0.45);
    aiTracker = checkpointSystem.createTracker();

    const startPt = splineSamples[0].point;
    const startTangent = splineSamples[0].tangent;
    const startNormal = splineSamples[0].normal;
    const startAngle = startTangent.angle();

    const p1Pos = startPt.clone().add(startNormal.clone().scale(-20));
    const aiPos = startPt.clone().add(startNormal.clone().scale(20)).sub(startTangent.clone().scale(50));

    playerCar.reset(p1Pos.x, p1Pos.y, startAngle);
    aiCar.reset(aiPos.x, aiPos.y, startAngle);

    lapTimer.start();
    raceManager.startRace();
    particles.clear();
    currentScreen = 'RACE';
  }

  // Navigation Menus
  const garageUI = new GarageUI(
    gameState,
    (car) => {},
    () => { currentScreen = 'TRACK_SELECT'; }
  );

  const trackSelectUI = new TrackSelectUI(
    gameState,
    (chosenTrack) => {
      setupTrack(chosenTrack.id);
      startRaceSession();
    }
  );

  // Key navigation listener for Menus
  window.addEventListener('keydown', (e) => {
    if (currentScreen === 'GARAGE') {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') garageUI.prevCar();
      if (e.code === 'KeyD' || e.code === 'ArrowRight') garageUI.nextCar();
      if (e.code === 'Space' || e.code === 'Enter') {
        const res = garageUI.buyOrSelect();
        if (res.action === 'selected') {
          currentScreen = 'TRACK_SELECT';
        }
      }
    } else if (currentScreen === 'TRACK_SELECT') {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') trackSelectUI.prevTrack();
      if (e.code === 'KeyD' || e.code === 'ArrowRight') trackSelectUI.nextTrack();
      if (e.code === 'Enter' || e.code === 'Space') trackSelectUI.selectCurrent();
      if (e.code === 'Escape') currentScreen = 'GARAGE';
    } else if (currentScreen === 'RACE') {
      if (e.code === 'Escape') currentScreen = 'GARAGE';
    }
  });

  let prevPlayerWheelPos = null;
  let prevAiWheelPos = null;

  const loop = new GameLoop({
    update: (dt) => {
      if (currentScreen === 'GARAGE') {
        garageUI.update(dt);
        return;
      }
      if (currentScreen === 'TRACK_SELECT') {
        return;
      }

      // --- RACING STATE ---
      const rawControls = input.getControls();
      if (rawControls.reset) {
        startRaceSession();
      }

      // Lock controls if countdown
      const playerControls = raceManager.canDrive() ? rawControls : { throttle: 0, brake: 0, steer: 0, handbrake: false };

      // Update surface friction
      surfaceManager.evaluateSurface(playerCar);
      surfaceManager.evaluateSurface(aiCar);

      // AI updates
      const aiDiff = rubberBanding.getDifficultyScalar(
        playerTracker.nextGateIndex * 15,
        aiTracker.nextGateIndex * 15,
        splineSamples.length
      );
      const aiControls = raceManager.canDrive() ? aiController.update(dt, aiDiff) : { throttle: 0, brake: 0, steer: 0, handbrake: false };

      playerCar.update(playerControls, dt);
      aiCar.update(aiControls, dt);

      // Collisions: Barriers
      for (const barrier of trackBarriers.getBarriers()) {
        if (CollisionSystem.resolveCarBarrier(playerCar, barrier)) {
          sounds.playImpactSound(playerCar.forwardVelocity);
        }
        CollisionSystem.resolveCarBarrier(aiCar, barrier);
      }

      // Collisions: Tabletop Props
      if (propManager.resolveCollisions(playerCar)) {
        sounds.playImpactSound(playerCar.forwardVelocity);
      }
      propManager.resolveCollisions(aiCar);

      // Collisions: Car vs Car
      if (CarVsCarCollision.resolve(playerCar, aiCar)) {
        sounds.playImpactSound(250);
      }

      // Update race & laps
      if (raceManager.state === 'RACING') {
        lapTimer.update(dt);
        checkpointSystem.updateTracker(playerTracker, playerCar.body.position, (laps) => {
          const result = lapTimer.recordLap();
          if (result.isNewBest) {
            gameState.recordLapTime(trackConfig.id, result.bestLapTime);
          }
        });
        checkpointSystem.updateTracker(aiTracker, aiCar.body.position);
      }

      raceManager.update(dt, playerTracker, aiTracker, gameState, trackConfig.id);

      // Audio Synthesis
      sounds.updateEngine(playerCar.forwardVelocity, playerCar.spec.stats.topSpeed, playerControls.throttle);
      sounds.updateDriftScreech(playerCar.isDrifting, playerCar.lateralVelocity);

      // Camera
      camera.follow(playerCar.body.position, playerCar.body.velocity, dt);

      // Tire particle effects
      const emitTireEffects = (car, prev) => {
        const heading = Vec2.fromAngle(car.body.angle);
        const right = new Vec2(-heading.y, heading.x);
        const rearAxle = car.body.position.clone().sub(heading.clone().scale(car.length * 0.45));
        const leftRear = rearAxle.clone().add(right.clone().scale(-car.width * 0.4));
        const rightRear = rearAxle.clone().add(right.clone().scale(car.width * 0.4));

        if (car.isDrifting) {
          if (prev) {
            particles.addSkidmark(prev.left, leftRear, 0.35);
            particles.addSkidmark(prev.right, rightRear, 0.35);
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
      if (currentScreen === 'GARAGE') {
        garageUI.render(ctx, canvas.width, canvas.height);
        return;
      }
      if (currentScreen === 'TRACK_SELECT') {
        trackSelectUI.render(ctx, canvas.width, canvas.height);
        return;
      }

      // Clear & Background
      ctx.fillStyle = trackConfig.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      camera.begin(ctx);

      // Draw Grid Mat
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

      // World Props below track or on infield
      propManager.render(ctx);

      // Track ribbon & Barriers
      trackRibbon.render(ctx);
      trackBarriers.render(ctx);

      // Skidmarks & Particles
      particles.render(ctx);

      // Vehicles
      VehicleRenderer.render(ctx, aiCar);
      VehicleRenderer.render(ctx, playerCar);

      camera.end(ctx);

      // --- Screen Space HUD ---
      // Top Left Telemetry
      ctx.fillStyle = 'rgba(15, 20, 26, 0.85)';
      ctx.fillRect(16, 16, 280, 130);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, 280, 130);

      ctx.fillStyle = '#4ae3b5';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`μRACING // ${trackConfig.name.toUpperCase()}`, 28, 40);

      ctx.fillStyle = '#e0e6ed';
      ctx.font = '13px monospace';
      const curLap = Math.min(trackConfig.laps, playerTracker.completedLaps + 1);
      ctx.fillText(`LAP: ${curLap} / ${trackConfig.laps}`, 28, 64);
      ctx.fillText(`TIME: ${LapTimer.formatTime(lapTimer.currentLapTime)}`, 28, 86);
      ctx.fillText(`BEST: ${LapTimer.formatTime(lapTimer.bestLapTime)}`, 28, 108);

      const speedKm = Math.round(playerCar.forwardVelocity * 0.45);
      ctx.fillStyle = playerCar.surfaceGripMultiplier < 0.8 ? '#e74c3c' : '#4ae3b5';
      ctx.fillText(`SURFACE: ${playerCar.surfaceGripMultiplier < 0.8 ? 'OFF-TRACK (SLOW)' : 'ASPHALT (CLEAN)'}`, 28, 130);

      // Speedometer Gauge bottom left
      speedometer.render(ctx, 20, canvas.height - 150, playerCar.forwardVelocity, playerCar.spec.stats.topSpeed, playerCar.isDrifting);

      // Minimap bottom right
      minimap.render(ctx, canvas.width - 190, canvas.height - 190, playerCar, [aiCar]);

      // Overlay controls instructions
      ControlsOverlay.render(ctx, canvas.width, canvas.height, currentScreen);

      // Race countdown / Finish overlay
      raceManager.renderOverlay(ctx, canvas.width, canvas.height);
    }
  });

  loop.start();
  console.info('μRacing engine ready with complete screens, audio synth, and garage!');
});
