/**
 * ControlsOverlay: Accessible floating HUD for touch devices or keybindings reminder
 */
export class ControlsOverlay {
  static render(ctx, width, height, currentMode = 'RACE') {
    if (currentMode !== 'RACE') return;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('[W / ↑] ACCEL  [S / ↓] BRAKE  [A/D / ←→] STEER', width - 20, 38);
    ctx.fillText('[SPACE] DRIFT  [SHIFT] NITRO  [R] RESTART  [ESC] GARAGE', width - 20, 56);
    ctx.restore();
  }
}
