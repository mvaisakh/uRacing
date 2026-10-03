import { VEHICLE_ROSTER } from '../vehicles/VehicleRoster.js';
import { Car } from '../vehicles/Car.js';

/**
 * GarageUI: AAA arcade-style showroom interface with glassmorphic cards,
 * segmented LED stat gauges, vehicle classification badges, and carousel navigator.
 */
export class GarageUI {
  constructor(gameState, onCarSelected, onStartRace) {
    this.gameState = gameState;
    this.onCarSelected = onCarSelected;
    this.onStartRace = onStartRace;

    this.carsList = Object.values(VEHICLE_ROSTER);
    this.currentIndex = this.carsList.findIndex(c => c.id === gameState.profile.selectedCar);
    if (this.currentIndex === -1) this.currentIndex = 0;

    this.previewCar = new Car(this.carsList[this.currentIndex]);
    this.turntableAngle = 0;
    this.animTime = 0;
  }

  nextCar() {
    this.currentIndex = (this.currentIndex + 1) % this.carsList.length;
    this.previewCar = new Car(this.carsList[this.currentIndex]);
  }

  prevCar() {
    this.currentIndex = (this.currentIndex - 1 + this.carsList.length) % this.carsList.length;
    this.previewCar = new Car(this.carsList[this.currentIndex]);
  }

  selectIndex(index) {
    if (index >= 0 && index < this.carsList.length) {
      this.currentIndex = index;
      this.previewCar = new Car(this.carsList[this.currentIndex]);
    }
  }

  getCurrentCar() {
    return this.carsList[this.currentIndex];
  }

  isUnlocked() {
    return this.gameState.profile.unlockedCars.includes(this.getCurrentCar().id);
  }

  canAfford() {
    return this.gameState.profile.coins >= this.getCurrentCar().cost;
  }

  buyOrSelect() {
    const current = this.getCurrentCar();
    if (this.isUnlocked()) {
      this.gameState.selectCar(current.id);
      if (this.onCarSelected) this.onCarSelected(current);
      return { success: true, action: 'selected' };
    } else if (this.canAfford()) {
      this.gameState.profile.coins -= current.cost;
      this.gameState.unlockCar(current.id);
      this.gameState.selectCar(current.id);
      if (this.onCarSelected) this.onCarSelected(current);
      return { success: true, action: 'purchased' };
    }
    return { success: false, action: 'insufficient_funds' };
  }

  update(dt) {
    this.turntableAngle += 0.8 * dt;
    this.animTime += dt;
    this.previewCar.body.angle = this.turntableAngle;
    this.previewCar.body.position.set(0, 0);
  }

  render(ctx, width, height) {
    ctx.save();

    // 1. Header Bar with Cyberpunk Glassmorphic Badge & Coin Counter
    this._renderHeader(ctx, width);

    // 2. Top Carousel Node Matrix (16 vehicles status dots)
    this._renderCarouselNodes(ctx, width);

    // 3. Navigation Chevrons
    this._renderNavigationChevrons(ctx, width, height);

    // 4. Main Glassmorphic Spec Card & LED Gauges
    this._renderSpecCard(ctx, width, height);

    ctx.restore();
  }

  _renderHeader(ctx, width) {
    // Header glass badge
    const headerW = 320;
    const headerH = 46;
    const headerX = 32;
    const headerY = 24;

    ctx.fillStyle = 'rgba(10, 14, 22, 0.75)';
    this._roundRect(ctx, headerX, headerY, headerW, headerH, 8, true, false);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, headerX, headerY, headerW, headerH, 8, false, true);

    // Cyan accent dot
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(headerX + 20, headerY + headerH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Impact", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('μRACING // DIE-CAST GARAGE', headerX + 34, headerY + 29);

    // Coins Purse Card
    const coinCardW = 210;
    const coinCardH = 46;
    const coinCardX = width - coinCardW - 32;
    const coinCardY = 24;

    ctx.fillStyle = 'rgba(10, 14, 22, 0.75)';
    this._roundRect(ctx, coinCardX, coinCardY, coinCardW, coinCardH, 8, true, false);
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.45)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, coinCardX, coinCardY, coinCardW, coinCardH, 8, false, true);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`🪙 ${this.gameState.profile.coins.toLocaleString()}`, coinCardX + coinCardW - 18, coinCardY + 29);
  }

  _renderCarouselNodes(ctx, width) {
    const total = this.carsList.length;
    const dotSpacing = 28;
    const startX = width / 2 - ((total - 1) * dotSpacing) / 2;
    const y = 46;

    for (let i = 0; i < total; i++) {
      const car = this.carsList[i];
      const isCurrent = i === this.currentIndex;
      const isUnlocked = this.gameState.profile.unlockedCars.includes(car.id);
      const isSelected = this.gameState.profile.selectedCar === car.id;
      const x = startX + i * dotSpacing;

      if (isCurrent) {
        // Glowing active node ring
        const pulse = 1 + 0.15 * Math.sin(this.animTime * 6);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 9 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#00cec9' : '#00f2fe';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = isSelected ? 'rgba(0, 206, 201, 0.7)' : (isUnlocked ? 'rgba(255, 255, 255, 0.4)' : 'rgba(231, 76, 60, 0.35)');
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Vehicle Counter indicator
    ctx.fillStyle = 'rgba(138, 180, 248, 0.85)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${String(this.currentIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, width / 2, 70);
  }

  _renderNavigationChevrons(ctx, width, height) {
    const centerY = height * 0.42;
    const pulse = Math.sin(this.animTime * 4) * 4;

    ctx.save();
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 242, 254, 0.7)';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;

    // Left Chevron
    ctx.fillText('‹', 50 - pulse, centerY);

    // Right Chevron
    ctx.fillText('›', width - 50 + pulse, centerY);
    ctx.restore();
  }

  _renderSpecCard(ctx, width, height) {
    const current = this.getCurrentCar();
    const isUnlocked = this.isUnlocked();
    const isSelected = this.gameState.profile.selectedCar === current.id;

    const cardW = Math.min(840, width - 64);
    const cardH = 240;
    const cardX = width / 2 - cardW / 2;
    const cardY = height - cardH - 24;

    // Glass backdrop with drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(12, 17, 26, 0.88)';
    this._roundRect(ctx, cardX, cardY, cardW, cardH, 14, true, false);
    ctx.restore();

    // Subtle neon glass border
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, cardX, cardY, cardW, cardH, 14, false, true);

    // Corner HUD Brackets
    this._drawHudCorners(ctx, cardX, cardY, cardW, cardH, '#00f2fe');

    // Left Column: Identity & Badges
    const colLeftW = cardW * 0.44;
    const leftMargin = cardX + 32;

    // Class Badge
    const badge = this._getClassBadgeInfo(current.modelId, current.era);
    this._drawPillBadge(ctx, leftMargin, cardY + 28, badge.label, badge.color);

    // Car Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Impact", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(current.name.toUpperCase(), leftMargin, cardY + 84);

    // Era / Subtitle
    ctx.fillStyle = '#8ab4f8';
    ctx.font = '13px monospace';
    ctx.fillText(current.era, leftMargin, cardY + 108);

    // Description text (wrapped)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    this._wrapText(ctx, current.description, leftMargin, cardY + 134, colLeftW - 16, 17);

    // Right Column: Segmented LED Stat Gauges
    const rightMargin = cardX + colLeftW + 24;
    const gaugeW = cardW - colLeftW - 56;
    const startGaugeY = cardY + 32;
    const gaugeStep = 32;

    const stats = current.stats;
    const topSpeedNorm = (stats.topSpeed - 380) / 160;
    const accelNorm = (stats.acceleration - 340) / 230;
    const steerNorm = (stats.steerRate - 1.6) / 2.4;
    const gripNorm = (stats.grip - 0.8) / 0.2;

    this._renderLedStatBar(ctx, rightMargin, startGaugeY, gaugeW, 'TOP SPEED', topSpeedNorm, `${stats.topSpeed} KM/H`, '#00f2fe');
    this._renderLedStatBar(ctx, rightMargin, startGaugeY + gaugeStep, gaugeW, 'ACCELERATION', accelNorm, `${stats.acceleration} PWR`, '#2ecc71');
    this._renderLedStatBar(ctx, rightMargin, startGaugeY + gaugeStep * 2, gaugeW, 'STEER AGILITY', steerNorm, `${stats.steerRate.toFixed(1)}x`, '#f1c40f');
    this._renderLedStatBar(ctx, rightMargin, startGaugeY + gaugeStep * 3, gaugeW, 'DRIFT CONTROL', gripNorm, `${Math.round(stats.grip * 100)}%`, '#e67e22');

    // Bottom Action Button Banner
    this._renderActionButton(ctx, cardX, cardY + cardH - 52, cardW, isSelected, isUnlocked, current);
  }

  _renderLedStatBar(ctx, x, y, width, label, ratio, valueStr, glowColor) {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const labelW = 100;
    const valueW = 80;
    const barW = width - labelW - valueW;
    const barH = 10;

    // Label
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(label, x, y + 9);

    // 10 LED Segments
    const segments = 10;
    const segSpacing = 3;
    const totalSpacing = (segments - 1) * segSpacing;
    const segW = (barW - totalSpacing) / segments;
    const activeSegs = Math.round(clampedRatio * segments);

    const barX = x + labelW;
    for (let i = 0; i < segments; i++) {
      const sx = barX + i * (segW + segSpacing);
      const isActive = i < activeSegs;

      if (isActive) {
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(sx, y + 1, segW, barH);
      ctx.shadowBlur = 0;
    }

    // Value Badge
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(valueStr, x + width, y + 9);
  }

  _renderActionButton(ctx, x, y, w, isSelected, isUnlocked, current) {
    const btnW = 340;
    const btnH = 38;
    const btnX = x + w / 2 - btnW / 2;
    const btnY = y;

    let text = '';
    let bgGradColor = '#00f2fe';
    let textColor = '#0f172a';

    if (isSelected) {
      text = '⚡ ACTIVE CAR  |  [ENTER] TO RACE';
      bgGradColor = '#00cec9';
    } else if (isUnlocked) {
      text = 'SELECT CAR  |  [SPACE / ENTER]';
      bgGradColor = '#2ecc71';
    } else {
      if (this.canAfford()) {
        text = `UNLOCK FOR 🪙 ${current.cost.toLocaleString()}  |  [ENTER]`;
        bgGradColor = '#f39c12';
      } else {
        text = `🔒 LOCKED  |  NEED 🪙 ${current.cost.toLocaleString()}`;
        bgGradColor = '#e74c3c';
        textColor = '#ffffff';
      }
    }

    // Button Glow & Background
    ctx.save();
    ctx.fillStyle = bgGradColor;
    ctx.shadowColor = bgGradColor;
    ctx.shadowBlur = 14;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 6, true, false);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText(text, btnX + btnW / 2, btnY + 24);
    ctx.restore();
  }

  _getClassBadgeInfo(modelId, era) {
    if (modelId === 'car_13') return { label: 'TAXI CAB', color: '#f1c40f' };
    if (modelId === 'car_14') return { label: 'POLICE PURSUIT', color: '#38ef7d' };
    if (modelId === 'car_15' || modelId === 'car_16') return { label: 'RALLY / APEX GT', color: '#ff7675' };
    if (['car_10', 'car_11', 'car_12'].includes(modelId)) return { label: 'TRANSIT BUS', color: '#0984e3' };
    if (['car_07', 'car_08', 'car_09'].includes(modelId)) return { label: 'COMMERCIAL VAN', color: '#e67e22' };
    if (['car_04', 'car_05', 'car_06'].includes(modelId)) return { label: 'SPORTS COUPE', color: '#d63031' };
    return { label: 'CLASSIC SALOON', color: '#00cec9' };
  }

  _drawPillBadge(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    const textW = ctx.measureText(text).width;
    const pillW = textW + 16;
    const pillH = 18;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this._roundRect(ctx, x, y - 12, pillW, pillH, 9, true, false);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y - 12, pillW, pillH, 9, false, true);

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text, x + 8, y + 1);
    ctx.restore();
  }

  _drawHudCorners(ctx, x, y, w, h, color) {
    const len = 12;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Top Left
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currY);
  }

  _roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
