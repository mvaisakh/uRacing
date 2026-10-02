import { TRACK_ROSTER } from '../track/TrackRoster.js';
import { CatmullRomSpline } from '../track/Spline.js';

/**
 * TrackSelectUI: Modern AAA arcade circuit selection screen with:
 * - Glassmorphic blueprint circuit preview with glowing neon track ribbon
 * - Elevation profile preview graph (Trackmania jumps, ramps, valleys)
 * - Start / finish checkered gate and direction markers
 * - Circuit difficulty ratings, environment badges, and personal best records
 * - 6-track carousel indicator dot matrix
 */
export class TrackSelectUI {
  constructor(gameState, onTrackChosen) {
    this.gameState = gameState;
    this.onTrackChosen = onTrackChosen;

    this.tracksList = Object.values(TRACK_ROSTER);
    this.currentIndex = 0;
    this.animTime = 0;

    // Cache precomputed splines and elevation profiles for smooth 60fps rendering
    this._trackCache = new Map();
    this._initTrackCache();
  }

  _initTrackCache() {
    for (const track of this.tracksList) {
      const spline = new CatmullRomSpline(track.waypoints, true);
      const samples = spline.sampleEvenly(12);

      // Compute bounding box for minimap scaling
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (const s of samples) {
        if (s.point.x < minX) minX = s.point.x;
        if (s.point.x > maxX) maxX = s.point.x;
        if (s.point.y < minY) minY = s.point.y;
        if (s.point.y > maxY) maxY = s.point.y;
      }

      // Trackmania elevation function matching ThreeRenderer
      const trackBaseY = 3;
      const elevFn = (p) => {
        const ease = (t) => (1 - Math.cos(t * Math.PI)) / 2;
        if (p < 0.10) return trackBaseY;
        if (p < 0.20) { const t = (p - 0.10) / 0.10; return trackBaseY + ease(t) * 20; }
        if (p < 0.28) return trackBaseY + 20;
        if (p < 0.36) { const t = (p - 0.28) / 0.08; return trackBaseY + 20 + ease(t) * 30; }
        if (p < 0.40) return trackBaseY + 50;
        if (p < 0.48) { const t = (p - 0.40) / 0.08; return trackBaseY + 50 - ease(t) * 55; }
        if (p < 0.55) return trackBaseY - 5;
        if (p < 0.62) { const t = (p - 0.55) / 0.07; return trackBaseY - 5 + ease(t) * 35; }
        if (p < 0.68) return trackBaseY + 30;
        if (p < 0.80) { const t = (p - 0.68) / 0.12; return trackBaseY + 30 - ease(t) * 30; }
        if (p < 0.90) return trackBaseY;
        return trackBaseY;
      };

      // Compute approximate total length in meters (scaled for die-cast micro toys)
      let lengthSum = 0;
      for (let i = 0; i < samples.length; i++) {
        const next = (i + 1) % samples.length;
        lengthSum += samples[i].point.dist(samples[next].point);
      }
      const circuitLengthMeters = Math.round(lengthSum * 0.05);

      this._trackCache.set(track.id, {
        samples,
        bounds: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
        circuitLengthMeters,
        elevFn
      });
    }
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

  update(dt = 0.016) {
    this.animTime += dt;
  }

  render(ctx, width, height) {
    this.animTime += 0.016;

    ctx.save();

    // Dark high-tech tinted backdrop with vignette
    this._renderBackdrop(ctx, width, height);

    // 1. Top Navigation & Track Matrix Carousel
    this._renderHeader(ctx, width);
    this._renderCarouselNodes(ctx, width);

    // 2. Main Split Panels: Left = Blueprint Circuit Minimap + Elevation Profile; Right = Track Details & Start CTA
    const track = this.getCurrentTrack();
    const cache = this._trackCache.get(track.id);

    const mainY = 90;
    const mainH = height - mainY - 60;
    const totalW = Math.min(1080, width - 48);
    const startX = (width - totalW) / 2;

    const leftW = Math.floor(totalW * 0.58);
    const rightW = totalW - leftW - 20;
    const rightX = startX + leftW + 20;

    this._renderCircuitBlueprintCard(ctx, startX, mainY, leftW, mainH, track, cache);
    this._renderTrackInfoCard(ctx, rightX, mainY, rightW, mainH, track, cache);

    // 3. Navigation Chevron Guides
    this._renderChevrons(ctx, width, height);

    ctx.restore();
  }

  _renderBackdrop(ctx, width, height) {
    // Deep midnight gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(0.5, '#0e141f');
    bgGrad.addColorStop(1, '#07090d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  _renderHeader(ctx, width) {
    const headerW = 280;
    const headerH = 42;
    const headerX = 28;
    const headerY = 24;

    ctx.fillStyle = 'rgba(12, 17, 26, 0.85)';
    this._roundRect(ctx, headerX, headerY, headerW, headerH, 8, true, false);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, headerX, headerY, headerW, headerH, 8, false, true);

    // Cyan glowing indicator
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(headerX + 18, headerY + headerH / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Impact", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CIRCUIT GRAND PRIX // SELECT', headerX + 32, headerY + 26);
  }

  _renderCarouselNodes(ctx, width) {
    const total = this.tracksList.length;
    const spacing = 32;
    const startX = width / 2 - ((total - 1) * spacing) / 2;
    const y = 45;

    for (let i = 0; i < total; i++) {
      const isCurrent = i === this.currentIndex;
      const x = startX + i * spacing;

      if (isCurrent) {
        // Active circuit pill
        ctx.fillStyle = '#00f2fe';
        this._roundRect(ctx, x - 12, y - 5, 24, 10, 5, true, false);

        ctx.strokeStyle = 'rgba(0, 242, 254, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Inactive track node
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _renderCircuitBlueprintCard(ctx, x, y, w, h, track, cache) {
    // Glass card background
    ctx.fillStyle = 'rgba(12, 17, 26, 0.85)';
    this._roundRect(ctx, x, y, w, h, 14, true, false);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x, y, w, h, 14, false, true);

    // Decorative corner brackets
    this._drawCornerBrackets(ctx, x, y, w, h, '#00f2fe');

    // Title badge inside card
    ctx.fillStyle = '#8ab4f8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CIRCUIT BLUEPRINT & ELEVATION TOPOGRAPHY', x + 24, y + 30);

    const pulse = 0.7 + Math.sin(this.animTime * 3) * 0.3;
    ctx.fillStyle = `rgba(0, 242, 254, ${pulse})`;
    ctx.fillText('● LIVE RADAR', x + w - 110, y + 30);

    // Divide area into Circuit Map (upper 65%) and Elevation Profile (lower 35%)
    const mapH = Math.floor(h * 0.62);
    const mapY = y + 42;
    const mapPad = 32;

    this._drawCircuitSpline(ctx, x + mapPad, mapY, w - mapPad * 2, mapH - mapPad, cache.samples, cache.bounds);

    // Divider line
    const divY = mapY + mapH - 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 20, divY);
    ctx.lineTo(x + w - 20, divY);
    ctx.stroke();

    // Elevation graph in bottom portion
    const elevY = divY + 14;
    const elevH = h - (elevY - y) - 20;
    this._drawElevationProfile(ctx, x + 24, elevY, w - 48, elevH, cache.elevFn);
  }

  _drawCircuitSpline(ctx, cx, cy, cw, ch, samples, bounds) {
    if (!samples || samples.length === 0) return;

    const scale = Math.min(cw / bounds.width, ch / bounds.height) * 0.85;
    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;

    const toScreen = (pt) => ({
      x: cx + cw / 2 + (pt.x - midX) * scale,
      y: cy + ch / 2 + (pt.y - midY) * scale
    });

    // 1. Track width ribbon glow (underlay)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.lineWidth = 26;
    ctx.beginPath();
    const p0 = toScreen(samples[0].point);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < samples.length; i++) {
      const p = toScreen(samples[i].point);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // 2. Secondary track edge border
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < samples.length; i++) {
      const p = toScreen(samples[i].point);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // 3. Crisp neon center line
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < samples.length; i++) {
      const p = toScreen(samples[i].point);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // 4. Animated racing energy beacon traveling around track
    const beaconIdx = Math.floor((this.animTime * 14) % samples.length);
    const beaconPt = toScreen(samples[beaconIdx].point);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(beaconPt.x, beaconPt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Start/Finish checkered line banner
    const startPt = toScreen(samples[0].point);
    const norm = samples[0].normal;
    const barLen = 14;
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startPt.x - norm.x * barLen, startPt.y - norm.y * barLen);
    ctx.lineTo(startPt.x + norm.x * barLen, startPt.y + norm.y * barLen);
    ctx.stroke();

    // Start text badge
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 START / FINISH', startPt.x, startPt.y - 12);
  }

  _drawElevationProfile(ctx, ex, ey, ew, eh, elevFn) {
    ctx.fillStyle = '#8ab4f8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('3D ELEVATION PROFILE // TRACKMANIA JUMPS & DROPS', ex, ey + 10);

    const graphY = ey + 22;
    const graphH = eh - 28;

    // Graph frame background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this._roundRect(ctx, ex, graphY, ew, graphH, 6, true, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, ex, graphY, ew, graphH, 6, false, true);

    // Reference baseline
    const baseY = graphY + graphH * 0.72;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ex, baseY);
    ctx.lineTo(ex + ew, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sample elevation curve
    const steps = 60;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const elev = elevFn(p); // range roughly -5 to +50
      // Map elevation to pixel height
      const y = baseY - (elev / 55) * (graphH * 0.65);
      const x = ex + (i / steps) * ew;
      points.push({ x, y });
    }

    // Fill under curve
    const grad = ctx.createLinearGradient(0, graphY, 0, graphY + graphH);
    grad.addColorStop(0, 'rgba(255, 102, 0, 0.45)');
    grad.addColorStop(1, 'rgba(255, 102, 0, 0.02)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    for (const pt of points) ctx.lineTo(pt.x, pt.y);
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.closePath();
    ctx.fill();

    // Draw curve line
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Ramp / Drop feature callouts
    ctx.fillStyle = '#ff793f';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▲ LAUNCH RAMP (+50m)', ex + ew * 0.38, graphY + 14);
    ctx.fillText('▼ DROP', ex + ew * 0.52, baseY + 14);
  }

  _renderTrackInfoCard(ctx, x, y, w, h, track, cache) {
    // Glass card background
    ctx.fillStyle = 'rgba(12, 17, 26, 0.85)';
    this._roundRect(ctx, x, y, w, h, 14, true, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x, y, w, h, 14, false, true);

    // Decorative corner brackets
    this._drawCornerBrackets(ctx, x, y, w, h, '#ff9f43');

    // 1. Environment Theme Badge
    const envThemes = {
      kitchen: { label: 'KITCHEN COUNTERTOP', color: '#ff9f43', icon: '🍳' },
      workshop: { label: 'WORKSHOP WORKBENCH', color: '#54a0ff', icon: '🔧' },
      garden: { label: 'GARDEN PATIO', color: '#1dd1a1', icon: '🌿' },
      playroom: { label: 'PLAYROOM CARPET', color: '#ee5253', icon: '🧸' },
      office: { label: 'ARCHITECT DESK', color: '#f368e0', icon: '📐' }
    };
    const envInfo = envThemes[track.environment] || { label: track.environment.toUpperCase(), color: '#00f2fe', icon: '🏁' };

    const envBadgeW = 210;
    const envBadgeH = 28;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this._roundRect(ctx, x + 24, y + 24, envBadgeW, envBadgeH, 6, true, false);
    ctx.strokeStyle = envInfo.color;
    ctx.lineWidth = 1.2;
    this._roundRect(ctx, x + 24, y + 24, envBadgeW, envBadgeH, 6, false, true);

    ctx.fillStyle = envInfo.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${envInfo.icon}  THEME: ${envInfo.label}`, x + 34, y + 42);

    // 2. Track Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Impact", sans-serif';
    ctx.fillText(track.name.toUpperCase(), x + 24, y + 84);

    // 3. Technical Specs Grid (Laps, Length, Width, Turns)
    const waypointsCount = track.waypoints.length;
    const specs = [
      { label: 'CIRCUIT LENGTH', val: `${cache.circuitLengthMeters}m`, color: '#00f2fe' },
      { label: 'RACE DISTANCE', val: `${track.laps} LAPS`, color: '#feca57' },
      { label: 'TRACK WIDTH', val: `${track.trackWidth}px`, color: '#48dbfb' },
      { label: 'KEY CORNERS', val: `${waypointsCount} APEXES`, color: '#ff9ff3' }
    ];

    const gridY = y + 104;
    const itemW = (w - 48 - 14) / 2;
    const itemH = 58;

    specs.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ix = x + 24 + col * (itemW + 14);
      const iy = gridY + row * (itemH + 10);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      this._roundRect(ctx, ix, iy, itemW, itemH, 6, true, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, ix, iy, itemW, itemH, 6, false, true);

      ctx.fillStyle = '#8395a7';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, ix + 12, iy + 20);

      ctx.fillStyle = item.color;
      ctx.font = 'bold 18px "Impact", sans-serif';
      ctx.fillText(item.val, ix + 12, iy + 45);
    });

    // 4. Personal Best Lap Record Banner
    const recordY = gridY + itemH * 2 + 30;
    const record = this.gameState.profile.trackRecords[track.id];

    ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
    this._roundRect(ctx, x + 24, recordY, w - 48, 62, 8, true, false);
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x + 24, recordY, w - 48, 62, 8, false, true);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 FASTEST RECORDED LAP TIME', x + 40, recordY + 24);

    ctx.font = 'bold 22px monospace';
    const recordStr = record ? `${(record).toFixed(3)}s` : '--.---s';
    ctx.fillText(recordStr, x + 40, recordY + 50);

    if (record) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('RECORD VERIFIED', x + w - 44, recordY + 45);
    }

    // 5. Large Glowing Action CTA Button
    const btnW = w - 48;
    const btnH = 54;
    const btnX = x + 24;
    const btnY = h - 74 + y;

    const pulse = Math.sin(this.animTime * 4) * 0.2 + 0.8;
    ctx.fillStyle = '#2ecc71';
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 8, true, false);

    ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.lineWidth = 2;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 8, false, true);

    ctx.fillStyle = '#0a1d12';
    ctx.font = 'bold 18px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RACE THIS CIRCUIT [ENTER]', btnX + btnW / 2, btnY + 34);
  }

  _renderChevrons(ctx, width, height) {
    const pulse = Math.sin(this.animTime * 4) * 0.25 + 0.75;
    ctx.fillStyle = `rgba(0, 242, 254, ${pulse})`;
    ctx.font = 'bold 18px monospace';

    // Left chevron
    ctx.textAlign = 'left';
    ctx.fillText('◄ [A / LEFT] PREV', 32, height - 24);

    // Right chevron
    ctx.textAlign = 'right';
    ctx.fillText('NEXT [D / RIGHT] ►', width - 32, height - 24);
  }

  _drawCornerBrackets(ctx, x, y, w, h, color) {
    const len = 14;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
  }

  _roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
