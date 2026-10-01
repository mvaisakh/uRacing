/**
 * TouchControls: On-screen d-pad and action touch buttons for mobile browser playability.
 */
export class TouchControls {
  constructor(inputHandler) {
    this.input = inputHandler;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.touches = new Map();
  }

  render(ctx, width, height) {
    if (!this.isTouchDevice) return;

    ctx.save();
    // Steering pads Left / Right on bottom-left
    const btnSize = 64;
    const padding = 20;

    // Steer Left
    this._drawButton(ctx, padding, height - btnSize - padding, btnSize, btnSize, '◄', '#2c3e50');
    // Steer Right
    this._drawButton(ctx, padding + btnSize + 12, height - btnSize - padding, btnSize, btnSize, '►', '#2c3e50');

    // Gas & Brake & Nitro on bottom-right
    // Brake
    this._drawButton(ctx, width - (btnSize * 2 + padding * 2), height - btnSize - padding, btnSize, btnSize, 'REV', '#c0392b');
    // Gas
    this._drawButton(ctx, width - (btnSize + padding), height - btnSize - padding, btnSize, btnSize, 'GAS', '#27ae60');
    // Nitro
    this._drawButton(ctx, width - (btnSize + padding), height - btnSize * 2 - padding * 1.5, btnSize, btnSize, 'BOOST', '#2980b9');

    ctx.restore();
  }

  _drawButton(ctx, x, y, w, h, text, color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }
}
