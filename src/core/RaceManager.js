/**
 * RaceManager: Tracks positions, countdown sequences, race finish triggers, and reward payouts.
 * Supports flexible multi-car grids (Player + up to 9 AI rivals).
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
    this.playerFinishPosition = 1;
    this.totalRacers = 2;
  }

  startRace(totalRacers = 2) {
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.9;
    this.isFinished = false;
    this.winner = null;
    this.playerFinishPosition = 1;
    this.totalRacers = totalRacers;
  }

  update(dt, playerTracker, aiTrackers = [], gameState, trackId) {
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.state = 'RACING';
      }
    } else if (this.state === 'RACING') {
      const trackers = Array.isArray(aiTrackers) ? aiTrackers : [aiTrackers];

      // Check if player finished
      if (playerTracker.completedLaps >= this.totalLaps) {
        this.state = 'FINISHED';
        // Compute how many AI finished before player
        let finishedBefore = 0;
        for (const t of trackers) {
          if (t && t.completedLaps >= this.totalLaps) {
            finishedBefore++;
          }
        }
        this.playerFinishPosition = finishedBefore + 1;
        this.winner = this.playerFinishPosition === 1 ? 'player' : 'ai';

        // Dynamic rewards based on finish position
        let coinsEarned = 25;
        if (this.playerFinishPosition === 1) coinsEarned = 200;
        else if (this.playerFinishPosition === 2) coinsEarned = 100;
        else if (this.playerFinishPosition === 3) coinsEarned = 60;
        else if (this.playerFinishPosition <= 5) coinsEarned = 40;

        gameState.profile.coins += coinsEarned;
        gameState.save();
        if (this.onRaceFinish) this.onRaceFinish(this.winner, coinsEarned, this.playerFinishPosition);
      } else {
        // Check if all AI cars finished or first AI finished
        const anyAiFinishedFirst = trackers.some(t => t && t.completedLaps >= this.totalLaps);
        // Note: Let player continue driving to finish their laps even if 1st place AI crosses line
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

      const pos = this.playerFinishPosition;
      const posSuffix = (pos === 1) ? '1ST' : (pos === 2 ? '2ND' : (pos === 3 ? '3RD' : `${pos}TH`));

      if (pos === 1) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('🏆 1ST PLACE! CHAMPION!', width / 2, height / 2 - 30);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText('+200 COINS EARNED', width / 2, height / 2 + 25);
      } else if (pos <= 3) {
        ctx.fillStyle = '#00f2fe';
        ctx.fillText(`PODIUM FINISH! ${posSuffix} PLACE`, width / 2, height / 2 - 30);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#f1c40f';
        const reward = pos === 2 ? '+100' : '+60';
        ctx.fillText(`${reward} COINS EARNED`, width / 2, height / 2 + 25);
      } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`${posSuffix} PLACE - FINISHED`, width / 2, height / 2 - 30);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText('+25 CONSOLATION COINS', width / 2, height / 2 + 25);
      }

      ctx.font = '16px monospace';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('PRESS [R] TO RACE AGAIN OR [ESC] FOR GARAGE', width / 2, height / 2 + 65);
      ctx.restore();
    }
  }
}
