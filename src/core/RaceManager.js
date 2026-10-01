/**
 * RaceManager: Tracks positions, countdown sequences, race finish triggers, and reward payouts.
 */
export class RaceManager {
  constructor({ totalLaps = 3, onRaceFinish = null } = {}) {
    this.totalLaps = totalLaps;
    this.onRaceFinish = onRaceFinish;

    // States: 'COUNTDOWN', 'RACING', 'FINISHED'
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.9; // 3, 2, 1, GO!
    this.isFinished = false;
    this.winner = null; // 'player' | 'ai'
  }

  startRace() {
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.9;
    this.isFinished = false;
    this.winner = null;
  }

  update(dt, playerTracker, aiTracker, gameState, trackId) {
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.state = 'RACING';
      }
    } else if (this.state === 'RACING') {
      // Check finish condition
      if (playerTracker.completedLaps >= this.totalLaps) {
        this.state = 'FINISHED';
        this.winner = 'player';
        // Reward 150 coins for victory
        gameState.profile.coins += 150;
        gameState.save();
        if (this.onRaceFinish) this.onRaceFinish(this.winner, 150);
      } else if (aiTracker.completedLaps >= this.totalLaps) {
        this.state = 'FINISHED';
        this.winner = 'ai';
        // Consolation prize 30 coins
        gameState.profile.coins += 30;
        gameState.save();
        if (this.onRaceFinish) this.onRaceFinish(this.winner, 30);
      }
    }
  }

  canDrive() {
    return this.state === 'RACING' || this.state === 'FINISHED';
  }

  renderOverlay(ctx, width, height) {
    if (this.state === 'COUNTDOWN') {
      const count = Math.ceil(this.countdownTimer);
      const text = count > 3 ? 'READY...' : (count > 0 ? `${count}` : 'GO!');
      const color = count > 0 ? '#f1c40f' : '#2ecc71';

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, height / 2 - 80, width, 160);

      ctx.font = 'bold 72px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, height / 2);
      ctx.restore();
    } else if (this.state === 'FINISHED') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, height / 2 - 110, width, 220);

      ctx.textAlign = 'center';
      ctx.font = 'bold 54px "Impact", sans-serif';
      if (this.winner === 'player') {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('1ST PLACE! VICTORY!', width / 2, height / 2 - 30);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText('+150 COINS EARNED', width / 2, height / 2 + 25);
      } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('2ND PLACE - FINISHED', width / 2, height / 2 - 30);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText('+30 COINS EARNED', width / 2, height / 2 + 25);
      }

      ctx.font = '16px monospace';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('PRESS [R] TO RACE AGAIN OR [ESC] FOR GARAGE', width / 2, height / 2 + 65);
      ctx.restore();
    }
  }
}
