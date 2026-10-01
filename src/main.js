/**
 * μRacing - Main Entry Point
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Fatal: Failed to locate game-canvas element.');
    return;
  }

  // Base virtual resolution
  canvas.width = 960;
  canvas.height = 540;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e232a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  console.info('μRacing engine initialized.');
});
