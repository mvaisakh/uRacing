import { GameLoop } from './core/GameLoop.js';
import { StorageService } from './fs/StorageService.js';
import { InputHandler } from './input/InputHandler.js';
import { GameState } from './core/GameState.js';
import { VEHICLE_ROSTER } from './vehicles/VehicleRoster.js';
import { Car } from './vehicles/Car.js';
import { Camera3D } from './render/Camera3D.js';
import { ThreeRenderer } from './render/ThreeRenderer.js';
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
import { NitroSystem } from './vehicles/NitroSystem.js';
import { CameraShake } from './render/CameraShake.js';
import { NitroFlames } from './render/NitroFlames.js';
import { AudioSFXManager } from './audio/AudioSFXManager.js';
import { TouchControls } from './ui/TouchControls.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';
import { EngineDiagnostics } from './core/Diagnostics.js';

function initGame() {
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
  const camera = new Camera3D(canvas.width, canvas.height);
  const threeRenderer = new ThreeRenderer(canvas.width, canvas.height);
  const cameraShake = new CameraShake();
  const particles = new ParticleSystem();
  const sounds = new SoundSystem();
  const sfx = new AudioSFXManager(sounds);
  const speedometer = new SpeedometerHUD(130);
  const nitro = new NitroSystem();
  const touchControls = new TouchControls(input);
  const perfMon = new PerformanceMonitor();
  const diagnostics = new EngineDiagnostics();

  const unlockAudio = () => {
    sounds.init();
    sounds.resume();
    if (currentScreen === 'GARAGE' || currentScreen === 'TRACK_SELECT') {
      sounds.startMenuMusic();
    }
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  window.addEventListener('resize', () => {
    resizeCanvas();
    camera.resize(canvas.width, canvas.height);
    threeRenderer.resize(canvas.width, canvas.height);
  });

  let currentScreen = 'GARAGE';

  function setScreen(newScreen) {
    const prev = currentScreen;
    currentScreen = newScreen;

    if (newScreen === 'GARAGE' || newScreen === 'TRACK_SELECT') {
      if (!sounds.isBgmPlaying) {
        sounds.startMenuMusic();
      }
    } else if (newScreen === 'RACE') {
      sounds.stopMenuMusic();
    }
  }
  let currentTrackKey = 'kitchen_countertop';
  let trackConfig = TRACK_ROSTER[currentTrackKey];
  let spline, splineSamples, trackRibbon, trackBarriers;
  let surfaceManager, checkpointSystem, propManager, minimap;
  let lapTimer = new LapTimer();
  let rubberBanding = new RubberBanding();

  let playerCar = null;
  let playerTracker = null;
  let aiCar = null;
  let aiController = null;
  let aiTracker = null;

  const raceManager = new RaceManager({
    totalLaps: trackConfig.laps,
    onRaceFinish: (winner, coins) => {
      if (winner === 'player') {
        sfx.playWinChime();
      }
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
    if (raceManager) raceManager.totalLaps = trackConfig.laps;
    threeRenderer.buildEnvironment(trackConfig, splineSamples, trackBarriers, propManager);
    threeRenderer.clearParticles();
  }
  setupTrack(currentTrackKey);

  function startRaceSession() {
    const playerSpec = VEHICLE_ROSTER[gameState.profile.selectedCar] || VEHICLE_ROSTER.detroit_bruiser;
    playerCar = new Car(playerSpec);
    playerTracker = checkpointSystem.createTracker();

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
    setScreen('RACE');
  }

  const garageUI = new GarageUI(
    gameState,
    (car) => {},
    () => { setScreen('TRACK_SELECT'); }
  );

  const trackSelectUI = new TrackSelectUI(
    gameState,
    (chosenTrack) => {
      setupTrack(chosenTrack.id);
      startRaceSession();
    }
  );

  window.addEventListener('keydown', (e) => {
    if (currentScreen === 'GARAGE') {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') garageUI.prevCar();
      if (e.code === 'KeyD' || e.code === 'ArrowRight') garageUI.nextCar();
      if (e.code === 'Space' || e.code === 'Enter') {
        const res = garageUI.buyOrSelect();
        if (res.action === 'selected') {
          setScreen('TRACK_SELECT');
        }
      }
    } else if (currentScreen === 'TRACK_SELECT') {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') trackSelectUI.prevTrack();
      if (e.code === 'KeyD' || e.code === 'ArrowRight') trackSelectUI.nextTrack();
      if (e.code === 'Enter' || e.code === 'Space') trackSelectUI.selectCurrent();
      if (e.code === 'Escape') setScreen('GARAGE');
    } else if (currentScreen === 'RACE') {
      if (e.code === 'Escape') setScreen('GARAGE');
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
        trackSelectUI.update(dt);
        return;
      }

      const rawControls = input.getControls();
      if (rawControls.reset) {
        startRaceSession();
      }

      // Check nitro input
      if (rawControls.nitro && raceManager.canDrive()) {
        if (nitro.trigger()) {
          sfx.playNitroWhoosh();
          cameraShake.addTrauma(0.35);
        }
      }

      const playerControls = raceManager.canDrive() ? rawControls : { throttle: 0, brake: 0, steer: 0, handbrake: false };

      surfaceManager.evaluateSurface(playerCar);
      surfaceManager.evaluateSurface(aiCar);

      const aiDiff = rubberBanding.getDifficultyScalar(
        playerTracker.nextGateIndex * 15,
        aiTracker.nextGateIndex * 15,
        splineSamples.length
      );
      const aiControls = raceManager.canDrive() ? aiController.update(dt, aiDiff) : { throttle: 0, brake: 0, steer: 0, handbrake: false };

      playerCar.update(playerControls, dt);
      nitro.update(dt, playerCar);
      aiCar.update(aiControls, dt);

      // Collisions: Barriers
      for (const barrier of trackBarriers.getBarriers()) {
        if (CollisionSystem.resolveCarBarrier(playerCar, barrier)) {
          sounds.playImpactSound(playerCar.forwardVelocity);
          cameraShake.addTrauma(0.25);
        }
        CollisionSystem.resolveCarBarrier(aiCar, barrier);
      }

      // Collisions: Props
      if (propManager.resolveCollisions(playerCar)) {
        sounds.playImpactSound(playerCar.forwardVelocity);
        cameraShake.addTrauma(0.3);
      }
      propManager.resolveCollisions(aiCar);

      // Collisions: Car vs Car
      if (CarVsCarCollision.resolve(playerCar, aiCar)) {
        sounds.playImpactSound(250);
        cameraShake.addTrauma(0.2);
      }

      // Race & Laps
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

      // Audio & Camera
      sounds.updateEngine(playerCar.forwardVelocity, playerCar.spec.stats.topSpeed, playerControls.throttle);
      sounds.updateDriftScreech(playerCar.isDrifting, playerCar.lateralVelocity);
      camera.follow(playerCar.body.position, playerCar.body.angle, playerCar.body.velocity, dt);
      cameraShake.update(dt);

      // Particles
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
      const runtimeData = {
        fps: loop.fps,
        currentScreen,
        carName: playerCar ? playerCar.spec.name : garageUI.getCurrentCar().name,
        trackName: trackConfig.name,
        audioActive: sounds.initialized,
        particleCount: particles.particles.length,
        barrierCount: trackBarriers ? trackBarriers.barriers.length : 0
      };

      // Clear 2D canvas so WebGL shows through
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentScreen === 'GARAGE') {
        threeRenderer.setGarageMode(true, garageUI.previewCar);
        threeRenderer.render();
        garageUI.render(ctx, canvas.width, canvas.height);
        diagnostics.render(ctx, canvas.width, canvas.height, runtimeData);
        return;
      }
      
      threeRenderer.setGarageMode(false);

      if (currentScreen === 'TRACK_SELECT') {
        trackSelectUI.render(ctx, canvas.width, canvas.height);
        diagnostics.render(ctx, canvas.width, canvas.height, runtimeData);
        return;
      }

      // Apply shake to Three.js camera (if needed, but skip for now to ensure stability)
      const shake = cameraShake.getOffset();
      
      if (playerCar) threeRenderer.updateCar('player', playerCar, loop.step);
      if (aiCar) threeRenderer.updateCar('ai', aiCar, loop.step);
      
      // Update camera
      if (playerCar) {
         threeRenderer.updateCamera(playerCar, loop.step);
      }
      
      threeRenderer.render(loop.step);
      
      // 2D particles removed as they don't align with 3D perspective camera

      // --- Screen Space HUD ---
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

      // Nitro HUD Meter
      nitro.renderHUD(ctx, 310, 36);

      // Speedometer Gauge
      speedometer.render(ctx, 20, canvas.height - 150, playerCar.forwardVelocity, playerCar.spec.stats.topSpeed, playerCar.isDrifting);

      // Minimap
      minimap.render(ctx, canvas.width - 190, canvas.height - 190, playerCar, [aiCar]);

      // Overlay controls & touch
      ControlsOverlay.render(ctx, canvas.width, canvas.height, currentScreen);
      touchControls.render(ctx, canvas.width, canvas.height);

      // Race countdown / Finish overlay
      raceManager.renderOverlay(ctx, canvas.width, canvas.height);

      // Diagnostics Overlay
      diagnostics.render(ctx, canvas.width, canvas.height, runtimeData);
    }
  });

  loop.start();
  console.info('μRacing engine ready with locked 60fps loop, SFX, Nitro, and Camera Trauma!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
