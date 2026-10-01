import { VEHICLE_ROSTER } from '../vehicles/VehicleRoster.js';
import { VehicleRenderer } from '../render/VehicleRenderer.js';
import { Car } from '../vehicles/Car.js';

/**
 * GarageUI: Interactive micro showroom to inspect cars, view stats, purchase locks, and select active racer.
 */
export class GarageUI {
  constructor(gameState, onCarSelected, onStartRace) {
    this.gameState = gameState;
    this.onCarSelected = onCarSelected;
    this.onStartRace = onStartRace;

    this.carsList = Object.values(VEHICLE_ROSTER);
    this.currentIndex = this.carsList.findIndex(c => c.id === gameState.profile.selectedCar);
    if (this.currentIndex === -1) this.currentIndex = 0;

    // Display sample car
    this.previewCar = new Car(this.carsList[this.currentIndex]);
    this.turntableAngle = 0;
  }

  nextCar() {
    this.currentIndex = (this.currentIndex + 1) % this.carsList.length;
    this.previewCar = new Car(this.carsList[this.currentIndex]);
  }

  prevCar() {
    this.currentIndex = (this.currentIndex - 1 + this.carsList.length) % this.carsList.length;
    this.previewCar = new Car(this.carsList[this.currentIndex]);
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
    this.previewCar.body.angle = this.turntableAngle;
    this.previewCar.body.position.set(0, 0);
  }

  render(ctx, width, height) {
    // 1. Garage backdrop
    ctx.fillStyle = '#0f1318';
    ctx.fillRect(0, 0, width, height);

    // Diagonal metallic showroom floor patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let x = -width; x < width * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }

    // 2. Showcase Turntable Pedestal with 3D Depth
    const centerX = width / 2;
    const centerY = height * 0.40;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Deep pedestal ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 65, 170, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Beveled Turntable Base (Stacked cylinders)
    const baseLayers = 14;
    for (let i = 0; i < baseLayers; i++) {
      const yOffset = 30 - i * 1.8;
      const shade = 18 + i * 2;
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 10})`;
      ctx.beginPath();
      ctx.ellipse(0, yOffset, 150 - i * 0.8, 44 - i * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Glowing Neon Platform Rim
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Circular neon accent rings on turntable
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 6, 100, 28, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Preview car rendered with 3D elevation and 2.5x zoom
    ctx.save();
    ctx.translate(0, -6);
    ctx.scale(2.6, 2.6);
    VehicleRenderer.render(ctx, this.previewCar);
    ctx.restore();

    ctx.restore();

    // 3. Header & Wallet
    ctx.fillStyle = '#4ae3b5';
    ctx.font = 'bold 28px "Impact", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('μRACING // DIE-CAST GARAGE', 40, 60);

    ctx.textAlign = 'right';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`COINS: 🪙 ${this.gameState.profile.coins}`, width - 40, 60);

    // 4. Car Specs & Description Card
    const current = this.getCurrentCar();
    const isUnlocked = this.isUnlocked();
    const isSelected = this.gameState.profile.selectedCar === current.id;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Impact", sans-serif';
    ctx.fillText(current.name.toUpperCase(), width / 2, height * 0.68);

    ctx.fillStyle = '#8ab4f8';
    ctx.font = '14px monospace';
    ctx.fillText(current.era, width / 2, height * 0.72);

    ctx.fillStyle = '#bdc3c7';
    ctx.font = '13px sans-serif';
    ctx.fillText(current.description, width / 2, height * 0.76);

    // Stats bar cards
    this._renderStatBar(ctx, width / 2 - 180, height * 0.81, 'TOP SPEED', current.stats.topSpeed / 500);
    this._renderStatBar(ctx, width / 2 + 20, height * 0.81, 'ACCELERATION', current.stats.acceleration / 550);
    this._renderStatBar(ctx, width / 2 - 180, height * 0.85, 'HANDLING', (5 - current.stats.weight) / 4);
    this._renderStatBar(ctx, width / 2 + 20, height * 0.85, 'DRIFT GRIP', current.stats.grip);

    // 5. Action prompt button
    ctx.textAlign = 'center';
    let actionText = '';
    let btnColor = '#2ecc71';

    if (isSelected) {
      actionText = 'SELECTED (PRESS [ENTER] TO RACE)';
      btnColor = '#00cec9';
    } else if (isUnlocked) {
      actionText = 'PRESS [SPACE / ENTER] TO SELECT CAR';
      btnColor = '#2ecc71';
    } else {
      if (this.canAfford()) {
        actionText = `UNLOCK CAR: 🪙 ${current.cost} (PRESS [ENTER])`;
        btnColor = '#f39c12';
      } else {
        actionText = `LOCKED (COST: 🪙 ${current.cost} COINS)`;
        btnColor = '#e74c3c';
      }
    }

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = btnColor;
    ctx.fillText(actionText, width / 2, height * 0.92);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('◄ PREV CAR [A / LEFT]    |    NEXT CAR [D / RIGHT] ►', width / 2, height * 0.96);
  }

  _renderStatBar(ctx, x, y, label, ratio) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText(label, x, y + 10);

    const barW = 160;
    const barH = 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x + 90, y + 2, barW, barH);

    ctx.fillStyle = '#4ae3b5';
    ctx.fillRect(x + 90, y + 2, barW * Math.min(1.0, Math.max(0, ratio)), barH);
    ctx.restore();
  }
}
