import * as THREE from 'three';

/**
 * PropTextureGenerator:
 * Generates sharp, stylized 2D billboard sprite textures for miniature desktop racing props
 * using client-side HTML5 2D Canvas.
 */
export class PropTextureGenerator {
  constructor() {
    this.cache = new Map();
  }

  getTexture(type, variant = 0) {
    const key = `${type}_${variant}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    if (type === 'pencil') {
      this._drawPencil(ctx, variant);
    } else if (type === 'eraser') {
      this._drawEraser(ctx, variant);
    } else if (type === 'sharpener') {
      this._drawSharpener(ctx, variant);
    } else if (type === 'paint') {
      this._drawPaintTube(ctx, variant);
    } else if (type === 'utensil') {
      this._drawUtensil(ctx, variant);
    } else if (type === 'vegetable') {
      this._drawVegetable(ctx, variant);
    } else {
      this._drawPencil(ctx, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this.cache.set(key, texture);
    return texture;
  }

  _drawPencil(ctx, variant) {
    const colors = ['#f1c40f', '#e74c3c', '#3498db'];
    const bodyColor = colors[variant % colors.length];

    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(0.2);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-12, -45, 28, 95);

    // Main pencil body (hexagonal stripes)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-16, -50, 32, 75);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-16, -50, 8, 75);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(8, -50, 8, 75);

    // Metal ferrule
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-16, -56, 32, 8);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-16, -53, 32, 2);

    // Pink eraser top
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(0, -56, 15, Math.PI, 0);
    ctx.fill();

    // Sharpened wood cone
    ctx.fillStyle = '#f5cd79';
    ctx.beginPath();
    ctx.moveTo(-16, 25);
    ctx.lineTo(16, 25);
    ctx.lineTo(0, 58);
    ctx.closePath();
    ctx.fill();

    // Graphite lead tip
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.moveTo(-6, 45);
    ctx.lineTo(6, 45);
    ctx.lineTo(0, 58);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawEraser(ctx, variant) {
    const colors = [
      { main: '#ff7675', sleeve: '#0984e3', text: 'DUST-FREE' },
      { main: '#ffffff', sleeve: '#2d3436', text: 'VINYL' },
      { main: '#55efc4', sleeve: '#d63031', text: 'NEON' }
    ];
    const c = colors[variant % colors.length];

    ctx.save();
    ctx.translate(64, 64);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-38, -25, 80, 54);

    // Rubber block
    ctx.fillStyle = c.main;
    ctx.fillRect(-42, -28, 84, 56);

    // Cardboard sleeve
    ctx.fillStyle = c.sleeve;
    ctx.fillRect(-20, -28, 62, 56);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-20, -28, 62, 8);

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.text, 11, 4);

    ctx.restore();
  }

  _drawSharpener(ctx, variant) {
    const colors = ['#00cec9', '#e84393', '#fdcb6e'];
    const col = colors[variant % colors.length];

    ctx.save();
    ctx.translate(64, 64);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-30, -32, 64, 68);

    // Plastic body with ergonomic waist
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-32, -34);
    ctx.lineTo(32, -34);
    ctx.lineTo(26, 0);
    ctx.lineTo(32, 34);
    ctx.lineTo(-32, 34);
    ctx.lineTo(-26, 0);
    ctx.closePath();
    ctx.fill();

    // Metal blade
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(-12, -26, 24, 52);
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(8, -26, 4, 52);

    // Central screw
    ctx.fillStyle = '#636e72';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pencil entry hole
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(0, 24, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawPaintTube(ctx, variant) {
    const colors = [
      { tube: '#e17055', cap: '#2d3436' },
      { tube: '#6c5ce7', cap: '#2d3436' },
      { tube: '#00b894', cap: '#ffffff' }
    ];
    const c = colors[variant % colors.length];

    ctx.save();
    ctx.translate(64, 64);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-18, -44, 40, 92);

    // Metal crimped end
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(-22, -48, 44, 12);

    // Squeezed aluminum tube body
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(-20, -36, 40, 60);

    // Color swatch band on tube
    ctx.fillStyle = c.tube;
    ctx.fillRect(-20, -18, 40, 26);

    // White label band
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-20, 8, 40, 12);

    // Cap neck & ridged cap
    ctx.fillStyle = c.cap;
    ctx.fillRect(-12, 24, 24, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-12, 24, 4, 18);

    ctx.restore();
  }

  _drawUtensil(ctx, variant) {
    ctx.save();
    ctx.translate(64, 64);

    if (variant === 0) {
      // Fork
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-10, -50, 24, 105);

      ctx.fillStyle = '#dfe6e9';
      // Handle
      ctx.fillRect(-5, -10, 10, 65);
      // Tines base
      ctx.fillRect(-14, -30, 28, 22);
      // 4 Tines
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-13 + i * 8, -56, 4, 28);
      }
    } else if (variant === 1) {
      // Spatula / Turner
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-18, -50, 40, 105);

      // Handle (wood)
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-5, -5, 10, 62);
      // Metal shaft
      ctx.fillStyle = '#b2bec3';
      ctx.fillRect(-4, -25, 8, 22);
      // Spatula head
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-20, -56, 40, 34);
      // Slots
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(-12, -50, 4, 22);
      ctx.fillRect(-2, -50, 4, 22);
      ctx.fillRect(8, -50, 4, 22);
    } else {
      // Whisk
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-16, -50, 36, 105);

      // Handle
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-6, 5, 12, 50);
      // Wire loops
      ctx.strokeStyle = '#b2bec3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -26, 16, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -26, 9, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawVegetable(ctx, variant) {
    ctx.save();
    ctx.translate(64, 64);

    if (variant === 0) {
      // Carrot
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(4, 5, 16, 45, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Green leafy top
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-12, -54);
      ctx.lineTo(0, -42);
      ctx.lineTo(12, -54);
      ctx.closePath();
      ctx.fill();

      // Orange cone body
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.moveTo(-16, -30);
      ctx.lineTo(16, -30);
      ctx.lineTo(0, 52);
      ctx.closePath();
      ctx.fill();

      // Ridges
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -18); ctx.lineTo(6, -18);
      ctx.moveTo(-6, -2); ctx.lineTo(10, -2);
      ctx.moveTo(-8, 14); ctx.lineTo(4, 14);
      ctx.stroke();
    } else if (variant === 1) {
      // Tomato
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(4, 8, 30, 0, Math.PI * 2);
      ctx.fill();

      // Red fruit body
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(0, 4, 32, 0, Math.PI * 2);
      ctx.fill();

      // Shiny highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-10, -8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Green calyx stem
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      for (let a = 0; a < 5; a++) {
        const rad = (a * 72 * Math.PI) / 180;
        ctx.lineTo(Math.cos(rad) * 16, -28 + Math.sin(rad) * 10);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Garlic / Onion
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(4, 8, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f5f6fa';
      ctx.beginPath();
      ctx.arc(0, 6, 28, 0, Math.PI * 2);
      ctx.fill();

      // Top sprout
      ctx.fillStyle = '#4cd137';
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(-4, -48);
      ctx.lineTo(4, -48);
      ctx.closePath();
      ctx.fill();

      // Segment lines
      ctx.strokeStyle = '#dcdde1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-10, 6, 20, -0.6, 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, 6, 20, 2.5, 3.7);
      ctx.stroke();
    }

    ctx.restore();
  }
}
