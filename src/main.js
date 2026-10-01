import { GameLoop } from './core/GameLoop.js';
import { StorageService } from './fs/StorageService.js';
import { InputHandler } from './input/InputHandler.js';
import { GameState } from './core/GameState.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Fatal: Failed to locate game-canvas element.');
    return;
  }

  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');

  const storage = new StorageService('uracing');
  const gameState = new GameState(storage);
  const input = new InputHandler();

  const loop = new GameLoop({
    update: (dt) => {
      const controls = input.getControls();
      // Handle engine updates
    },
    render: (interp) => {
      ctx.fillStyle = '#171a21';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Diagnostic HUD
      ctx.fillStyle = '#4ae3b5';
      ctx.font = '14px monospace';
      ctx.fillText(`FPS: ${loop.fps}`, 16, 24);
      ctx.fillText(`Active Profile Car: ${gameState.profile.selectedCar}`, 16, 44);
      ctx.fillText(`Coins: ${gameState.profile.coins}`, 16, 64);

      const ctrl = input.getControls();
      ctx.fillStyle = '#8ab4f8';
      ctx.fillText(`Controls -> Throttle: ${ctrl.throttle} | Steer: ${ctrl.steer} | Brake: ${ctrl.brake}`, 16, 88);
    }
  });

  loop.start();
  console.info('μRacing engine initialized with state and input handlers.');
});
