import { TRACK_ROSTER } from '../track/TrackRoster.js';

/**
 * TrackSelectUI: Menu screen to pick circuits with lap records and environment previews.
 */
export class TrackSelectUI {
  constructor(gameState, onTrackChosen) {
    this.gameState = gameState;
    this.onTrackChosen = onTrackChosen;

    this.tracksList = Object.values(TRACK_ROSTER);
    this.currentIndex = 0;
  }

  nextTrack() {
    this.currentIndex = (this.currentIndex + 1) % this.tracksList.length;
  }

  prevTrack() {
    this.currentIndex = (this.currentIndex - 1 + this.tracksList.length) % this.tracksList.length;
  }

  getCurrentTrack() {
    return this.tracksList[this.currentIndex];
  }

  selectCurrent() {
    const track = this.getCurrentTrack();
    if (this.onTrackChosen) this.onTrackChosen(track);
  }

  render(ctx, width, height) {
    ctx.fillStyle = '#0f1318';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#4ae3b5';
    ctx.font = 'bold 30px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT CIRCUIT', width / 2, 70);

    const track = this.getCurrentTrack();
    const record = this.gameState.profile.trackRecords[track.id];

    // Card background
    const cardW = 540;
    const cardH = 260;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2 - 20;

    ctx.fillStyle = 'rgba(22, 28, 38, 0.9)';
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Impact", sans-serif';
    ctx.fillText(track.name.toUpperCase(), width / 2, cardY + 50);

    ctx.fillStyle = '#8ab4f8';
    ctx.font = '14px monospace';
    ctx.fillText(`ENVIRONMENT: ${track.environment.toUpperCase()} | LAPS: ${track.laps}`, width / 2, cardY + 90);

    // Record time
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 18px monospace';
    const recordStr = record ? `${(record).toFixed(3)}s` : 'NO RECORD SET';
    ctx.fillText(`BEST TIME: ⏱ ${recordStr}`, width / 2, cardY + 140);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRESS [ENTER] TO RACE THIS TRACK', width / 2, cardY + 210);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = '13px monospace';
    ctx.fillText('◄ PREV CIRCUIT [A / LEFT]    |    NEXT CIRCUIT [D / RIGHT] ►', width / 2, height - 50);
  }
}
