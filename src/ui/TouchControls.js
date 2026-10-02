/**
 * TouchControls: Responsive multi-touch controller supporting:
 * 1. Active Race: On-screen steering touch-pad / D-pad, Gas, Brake/Rev, Nitro, Handbrake drift, Reset.
 * 2. Menu Screens (Garage & Track Select): Touch swipes, previous/next chevron taps, and action button touch activation.
 * Includes visual touch ripples, tactile glow on press, and touch event binding.
 */
export class TouchControls {
  constructor(inputHandler, callbacks = {}) {
    this.input = inputHandler;
    this.callbacks = callbacks; // e.g. { onGaragePrev, onGarageNext, onGarageAction, onTrackPrev, onTrackNext, onTrackAction, onEscape }
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.activeTouches = new Map(); // id -> { x, y, buttonId }

    this.touchAreas = [];
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.currentMode = 'GARAGE';

    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.swipeStartTime = 0;

    this._bindTouchListeners();
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  setMode(mode) {
    this.currentMode = mode;
  }

  _bindTouchListeners() {
    const handleTouchStart = (e) => {
      // Prevent browser zoom / scroll behaviors
      e.preventDefault();

      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const tx = touch.clientX;
        const ty = touch.clientY;

        if (this.currentMode !== 'RACE') {
          // Record start of swipe gesture for menus
          this.swipeStartX = tx;
          this.swipeStartY = ty;
          this.swipeStartTime = Date.now();
        }

        const hitBtn = this._hitTest(tx, ty);
        if (hitBtn) {
          this.activeTouches.set(touch.identifier, { x: tx, y: ty, btn: hitBtn.id });
          this._handleButtonState(hitBtn.id, true);
        } else {
          this.activeTouches.set(touch.identifier, { x: tx, y: ty, btn: null });
        }
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const tx = touch.clientX;
        const ty = touch.clientY;
        const prev = this.activeTouches.get(touch.identifier);

        if (this.currentMode === 'RACE') {
          const hitBtn = this._hitTest(tx, ty);
          const currentBtnId = hitBtn ? hitBtn.id : null;
          if (prev && prev.btn !== currentBtnId) {
            if (prev.btn) this._handleButtonState(prev.btn, false);
            if (currentBtnId) this._handleButtonState(currentBtnId, true);
            this.activeTouches.set(touch.identifier, { x: tx, y: ty, btn: currentBtnId });
          }
        }
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const stored = this.activeTouches.get(touch.identifier);

        if (stored && stored.btn) {
          this._handleButtonState(stored.btn, false);
        }

        // Handle swipe / tap triggers in menus
        if (this.currentMode !== 'RACE') {
          const dx = touch.clientX - this.swipeStartX;
          const dy = touch.clientY - this.swipeStartY;
          const dt = Date.now() - this.swipeStartTime;

          // Quick horizontal swipe detection (> 40px within 400ms)
          if (dt < 400 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
              // Swiped left -> next
              if (this.currentMode === 'GARAGE' && this.callbacks.onGarageNext) this.callbacks.onGarageNext();
              if (this.currentMode === 'TRACK_SELECT' && this.callbacks.onTrackNext) this.callbacks.onTrackNext();
            } else {
              // Swiped right -> prev
              if (this.currentMode === 'GARAGE' && this.callbacks.onGaragePrev) this.callbacks.onGaragePrev();
              if (this.currentMode === 'TRACK_SELECT' && this.callbacks.onTrackPrev) this.callbacks.onTrackPrev();
            }
          }
        }

        this.activeTouches.delete(touch.identifier);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Mouse pointer fallback for desktop testing / clicking menu elements
    let isMouseDown = false;
    let mouseTargetBtn = null;
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseStartTime = 0;

    window.addEventListener('mousedown', (e) => {
      // Ignore if handled by touch
      if (this.activeTouches.size > 0) return;
      isMouseDown = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      mouseStartTime = Date.now();

      const hitBtn = this._hitTest(e.clientX, e.clientY);
      if (hitBtn) {
        mouseTargetBtn = hitBtn.id;
        this._handleButtonState(hitBtn.id, true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;

      if (mouseTargetBtn) {
        this._handleButtonState(mouseTargetBtn, false);
        mouseTargetBtn = null;
      }

      if (this.currentMode !== 'RACE') {
        const dx = e.clientX - mouseStartX;
        const dy = e.clientY - mouseStartY;
        const dt = Date.now() - mouseStartTime;
        if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) {
            if (this.currentMode === 'GARAGE' && this.callbacks.onGarageNext) this.callbacks.onGarageNext();
            if (this.currentMode === 'TRACK_SELECT' && this.callbacks.onTrackNext) this.callbacks.onTrackNext();
          } else {
            if (this.currentMode === 'GARAGE' && this.callbacks.onGaragePrev) this.callbacks.onGaragePrev();
            if (this.currentMode === 'TRACK_SELECT' && this.callbacks.onTrackPrev) this.callbacks.onTrackPrev();
          }
        }
      }
    });
  }

  _handleButtonState(btnId, isPressed) {
    if (this.currentMode === 'RACE') {
      if (btnId === 'steerLeft') this.input.setVirtualKey('KeyA', isPressed);
      if (btnId === 'steerRight') this.input.setVirtualKey('KeyD', isPressed);
      if (btnId === 'gas') this.input.setVirtualKey('KeyW', isPressed);
      if (btnId === 'brake') this.input.setVirtualKey('KeyS', isPressed);
      if (btnId === 'nitro') this.input.setVirtualKey('ShiftLeft', isPressed);
      if (btnId === 'drift') this.input.setVirtualKey('Space', isPressed);
      if (btnId === 'reset' && isPressed) {
        if (this.callbacks.onReset) this.callbacks.onReset();
      }
      if (btnId === 'exit' && isPressed) {
        if (this.callbacks.onEscape) this.callbacks.onEscape();
      }
    } else if (this.currentMode === 'GARAGE' && isPressed) {
      if (btnId === 'menuPrev' && this.callbacks.onGaragePrev) this.callbacks.onGaragePrev();
      if (btnId === 'menuNext' && this.callbacks.onGarageNext) this.callbacks.onGarageNext();
      if (btnId === 'menuAction' && this.callbacks.onGarageAction) this.callbacks.onGarageAction();
      if (btnId.startsWith('garageDot_') && this.callbacks.onGarageSelectIndex) {
        const idx = parseInt(btnId.replace('garageDot_', ''), 10);
        this.callbacks.onGarageSelectIndex(idx);
      }
    } else if (this.currentMode === 'TRACK_SELECT' && isPressed) {
      if (btnId === 'menuPrev' && this.callbacks.onTrackPrev) this.callbacks.onTrackPrev();
      if (btnId === 'menuNext' && this.callbacks.onTrackNext) this.callbacks.onTrackNext();
      if (btnId === 'menuAction' && this.callbacks.onTrackAction) this.callbacks.onTrackAction();
      if (btnId === 'menuBack' && this.callbacks.onEscape) this.callbacks.onEscape();
      if (btnId === 'oppMinus' && this.callbacks.onOppMinus) this.callbacks.onOppMinus();
      if (btnId === 'oppPlus' && this.callbacks.onOppPlus) this.callbacks.onOppPlus();
      if (btnId.startsWith('trackDot_') && this.callbacks.onTrackSelectIndex) {
        const idx = parseInt(btnId.replace('trackDot_', ''), 10);
        this.callbacks.onTrackSelectIndex(idx);
      }
    }
  }

  _hitTest(x, y) {
    for (let i = this.touchAreas.length - 1; i >= 0; i--) {
      const b = this.touchAreas[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        return b;
      }
    }
    return null;
  }

  isButtonPressed(btnId) {
    for (const val of this.activeTouches.values()) {
      if (val.btn === btnId) return true;
    }
    return false;
  }

  render(ctx, width, height) {
    this.lastWidth = width;
    this.lastHeight = height;
    this.touchAreas = [];

    if (!this.isTouchDevice) return;

    ctx.save();

    if (this.currentMode === 'RACE') {
      this._renderRaceControls(ctx, width, height);
    } else if (this.currentMode === 'GARAGE') {
      this._renderGarageMenuControls(ctx, width, height);
    } else if (this.currentMode === 'TRACK_SELECT') {
      this._renderTrackMenuControls(ctx, width, height);
    }

    ctx.restore();
  }

  _renderRaceControls(ctx, width, height) {
    // Left side: Steer Left & Steer Right
    const btnSize = Math.max(68, Math.min(84, width * 0.1));
    const pad = 24;

    // Steer Left Button
    const leftX = pad;
    const steerY = height - btnSize - pad;
    this._registerAndDrawButton(ctx, 'steerLeft', leftX, steerY, btnSize, btnSize, '◄', '#34495e', '#00f2fe');

    // Steer Right Button
    const rightX = leftX + btnSize + 14;
    this._registerAndDrawButton(ctx, 'steerRight', rightX, steerY, btnSize, btnSize, '►', '#34495e', '#00f2fe');

    // Drift / Handbrake button above steering
    const driftSize = btnSize * 0.85;
    this._registerAndDrawButton(ctx, 'drift', leftX, steerY - driftSize - 12, btnSize * 2 + 14, driftSize, 'DRIFT [SLIDE]', '#8e44ad', '#e056fd');

    // Right side: GAS, REV/BRAKE, NITRO
    const gasX = width - btnSize - pad;
    const gasY = height - btnSize - pad;
    this._registerAndDrawButton(ctx, 'gas', gasX, gasY, btnSize, btnSize, 'GAS', '#16a085', '#2ecc71');

    const brakeX = gasX - btnSize - 14;
    this._registerAndDrawButton(ctx, 'brake', brakeX, gasY, btnSize, btnSize, 'REV', '#c0392b', '#e74c3c');

    // Nitro button
    const nitroW = btnSize * 2 + 14;
    const nitroH = btnSize * 0.85;
    this._registerAndDrawButton(ctx, 'nitro', brakeX, gasY - nitroH - 12, nitroW, nitroH, '⚡ NITRO BOOST', '#d35400', '#f39c12');

    // Quick Exit & Reset buttons on top right
    const miniW = 76;
    const miniH = 34;
    this._registerAndDrawButton(ctx, 'reset', width - miniW * 2 - 28, 16, miniW, miniH, '↺ RESET', '#2c3e50', '#ffffff');
    this._registerAndDrawButton(ctx, 'exit', width - miniW - 16, 16, miniW, miniH, '✕ EXIT', '#2c3e50', '#ffffff');
  }

  _renderGarageMenuControls(ctx, width, height) {
    // Large touch-friendly chevron hit targets on screen edges
    const chevW = 64;
    const chevH = 100;
    const chevY = height * 0.40 - chevH / 2;

    this._registerButton('menuPrev', 8, chevY, chevW, chevH);
    this._registerButton('menuNext', width - chevW - 8, chevY, chevW, chevH);

    // Main action CTA touch target at bottom (matching card button)
    const cardW = Math.min(840, width - 64);
    const cardH = 240;
    const cardX = width / 2 - cardW / 2;
    const cardY = height - cardH - 24;

    const btnW = 340;
    const btnH = 46;
    const btnX = cardX + cardW / 2 - btnW / 2;
    const btnY = cardY + cardH - 56;

    this._registerButton('menuAction', btnX, btnY, btnW, btnH);

    // Register dot matrix hitboxes for 16 vehicles
    const totalCars = 16;
    const dotSpacing = 28;
    const matrixW = (totalCars - 1) * dotSpacing;
    const matrixStartX = width / 2 - matrixW / 2;
    const matrixY = 46;
    const dotHitRadius = 14;

    for (let i = 0; i < totalCars; i++) {
      const dx = matrixStartX + i * dotSpacing;
      this._registerButton(`garageDot_${i}`, dx - dotHitRadius, matrixY - dotHitRadius, dotHitRadius * 2, dotHitRadius * 2);
    }
  }

  _renderTrackMenuControls(ctx, width, height) {
    // Layout geometry matching TrackSelectUI
    const mainY = 90;
    const mainH = height - mainY - 60;
    const totalW = Math.min(1080, width - 48);
    const startX = (width - totalW) / 2;
    const leftW = Math.floor(totalW * 0.58);
    const rightW = totalW - leftW - 20;
    const rightX = startX + leftW + 20;

    // Chevrons
    const chevW = 64;
    const chevH = 100;
    const chevY = height * 0.40 - chevH / 2;

    this._registerButton('menuPrev', 8, chevY, chevW, chevH);
    this._registerButton('menuNext', width - chevW - 8, chevY, chevW, chevH);

    // Back to garage touch button (top left)
    const backW = 100;
    const backH = 38;
    this._registerAndDrawButton(ctx, 'menuBack', 16, 16, backW, backH, '◄ GARAGE', '#1e272e', '#00f2fe');

    // Track Carousel Dot Nodes (6 tracks)
    const totalTracks = 6;
    const dotSpacing = 32;
    const matrixStartX = width / 2 - ((totalTracks - 1) * dotSpacing) / 2;
    const dotY = 45;
    const dotHitRadius = 16;
    for (let i = 0; i < totalTracks; i++) {
      const dx = matrixStartX + i * dotSpacing;
      this._registerButton(`trackDot_${i}`, dx - dotHitRadius, dotY - dotHitRadius, dotHitRadius * 2, dotHitRadius * 2);
    }

    // Opponents Stepper touch targets
    const gridY = mainY + 104;
    const itemH = 58;
    const recordY = gridY + itemH * 2 + 16;
    const oppY = recordY + 58;
    const oppW = rightW - 48;
    const oppH = 56;
    const stepBtnSize = 42; // slightly larger touch hitbox for fingers
    const plusX = rightX + 24 + oppW - 16 - 32;
    const minusX = plusX - 32 - 54;
    const stepBtnY = oppY + (oppH - stepBtnSize) / 2;

    this._registerButton('oppMinus', minusX - 5, stepBtnY - 5, stepBtnSize + 10, stepBtnSize + 10);
    this._registerButton('oppPlus', plusX - 5, stepBtnY - 5, stepBtnSize + 10, stepBtnSize + 10);

    // Race Start Action CTA target
    const btnW = rightW - 48;
    const btnH = 58;
    const btnX = rightX + 24;
    const ctaBtnY = mainH - 74 + mainY;

    this._registerButton('menuAction', btnX, ctaBtnY, btnW, btnH);
  }

  _registerButton(id, x, y, w, h) {
    this.touchAreas.push({ id, x, y, w, h });
  }

  _registerAndDrawButton(ctx, id, x, y, w, h, text, baseColor, glowColor) {
    this._registerButton(id, x, y, w, h);
    const isPressed = this.isButtonPressed(id);

    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = isPressed ? 0.9 : 0.6;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isPressed ? 18 : 6;

    ctx.beginPath();
    this._roundRect(ctx, x, y, w, h, 10, true, false);

    ctx.strokeStyle = isPressed ? glowColor : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = isPressed ? 2.5 : 1.5;
    this._roundRect(ctx, x, y, w, h, 10, false, true);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);

    ctx.restore();
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
