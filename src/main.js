import { GameLoop } from './core/GameLoop.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Fatal: Failed to locate game-canvas element.');
    return;
  }

  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');

  let tickCount = 0;

  const loop = new GameLoop({
    update: (dt) => {
      tickCount++;
    },
    render: (interp) => {
      ctx.fillStyle = '#171a21';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Diagnostic HUD
      ctx.fillStyle = '#4ae3b5';
      ctx.font = '14px monospace';
      ctx.fillText(`FPS: ${loop.fps}`, 16, 24);
      ctx.fillText(`Ticks: ${tickCount}`, 16, 44);
    }
  });

  loop.start();
  console.info('μRacing game loop running.');
});
