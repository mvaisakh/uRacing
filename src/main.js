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

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Fatal: Failed to locate game-canvas element.');
    return;
  }

  // Adjust canvas buffer to viewport size dynamically
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    camera.resize(canvas.width, canvas.height);
  });

  const ctx = canvas.getContext('2d');
  const storage = new StorageService('uracing');
  const gameState = new GameState(storage);
  const input = new InputHandler();
  const camera = new Camera2D(canvas.width, canvas.height);
  const particles = new ParticleSystem();

  // Instantiate active player vehicle
  const currentSpec = VEHICLE_ROSTER[gameState.profile.selectedCar] || VEHICLE_ROSTER.detroit_bruiser;
  const playerCar = new Car(currentSpec);
  playerCar.reset(0, 0, 0);

  let prevRearWheelPos = null;

  const loop = new GameLoop({
    update: (dt) => {
      const controls = input.getControls();
      if (controls.reset) {
        playerCar.reset(0, 0, 0);
        particles.clear();
      }

      playerCar.update(controls, dt);
      camera.follow(playerCar.body.position, playerCar.body.velocity, dt);

      // Track drift skidmarks and smoke from rear wheels
      const heading = Vec2.fromAngle(playerCar.body.angle);
      const right = new Vec2(-heading.y, heading.x);
      const rearAxle = playerCar.body.position.clone().sub(heading.clone().scale(playerCar.length * 0.45));
      const leftRear = rearAxle.clone().add(right.clone().scale(-playerCar.width * 0.4));
      const rightRear = rearAxle.clone().add(right.clone().scale(playerCar.width * 0.4));

      if (playerCar.isDrifting) {
        if (prevRearWheelPos) {
          particles.addSkidmark(prevRearWheelPos.left, leftRear, 0.35);
          particles.addSkidmark(prevRearWheelPos.right, rightRear, 0.35);
        }
        particles.emitSmoke(rearAxle, playerCar.body.velocity, 2);
      }

      prevRearWheelPos = { left: leftRear, right: rightRear };
      particles.update(dt);
    },

    render: (interp) => {
      // Clear viewport
      ctx.fillStyle = '#14181f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // World Camera Begin
      camera.begin(ctx);

      // 1. Draw World Grid (Micro Floor Tiles / Cutting Mat)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 100;
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

      // Micro test track boundary circle
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 800, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 400, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Render Skidmarks & Smoke below vehicle
      particles.render(ctx);

      // 3. Render Vehicle
      VehicleRenderer.render(ctx, playerCar);

      // World Camera End
      camera.end(ctx);

      // 4. Screen-Space HUD / Telemetry
      ctx.fillStyle = '#4ae3b5';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillText(`FPS: ${loop.fps} | CAR: ${playerCar.spec.name}`, 20, 30);
      const speedKm = Math.round(playerCar.forwardVelocity * 0.45);
      ctx.fillText(`SPEED: ${speedKm} km/h ${playerCar.isDrifting ? ' [DRIFT]' : ''}`, 20, 50);

      ctx.fillStyle = '#8ab4f8';
      ctx.fillText(`CONTROLS: WASD / Arrows to drive | SPACE to Drift | R to Reset`, 20, canvas.height - 24);
    }
  });

  loop.start();
  console.info('μRacing running with Vehicle kinematics, Camera2D, and Particles.');
});
