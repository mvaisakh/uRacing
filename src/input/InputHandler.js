/**
 * InputHandler: Listens to keyboard events and maintains immediate key states.
 */
export class InputHandler {
  constructor() {
    this.keys = new Map();
    this.bindings = {
      throttle: ['KeyW', 'ArrowUp'],
      brake: ['KeyS', 'ArrowDown'],
      steerLeft: ['KeyA', 'ArrowLeft'],
      steerRight: ['KeyD', 'ArrowRight'],
      handbrake: ['Space'],
      nitro: ['ShiftLeft', 'ShiftRight'],
      reset: ['KeyR']
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this._onBlur.bind(this);

    this.attach();
  }

  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    this.keys.clear();
  }

  _onKeyDown(e) {
    this.keys.set(e.code, true);
    // Prevent default scroll on arrow keys / space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keys.set(e.code, false);
  }

  _onBlur() {
    this.keys.clear();
  }

  isDown(code) {
    return !!this.keys.get(code);
  }

  setVirtualKey(code, isPressed) {
    this.keys.set(code, isPressed);
  }

  isActionActive(actionName) {
    const boundCodes = this.bindings[actionName];
    if (!boundCodes) return false;
    for (const code of boundCodes) {
      if (this.keys.get(code)) return true;
    }
    return false;
  }

  /**
   * Returns normalized input axes:
   * throttle: 0 to 1
   * brake: 0 to 1
   * steer: -1 (left) to 1 (right)
   * handbrake: boolean
   */
  getControls() {
    const throttle = this.isActionActive('throttle') ? 1.0 : 0.0;
    const brake = this.isActionActive('brake') ? 1.0 : 0.0;
    let steer = 0.0;
    if (this.isActionActive('steerLeft')) steer -= 1.0;
    if (this.isActionActive('steerRight')) steer += 1.0;

    return {
      throttle,
      brake,
      steer,
      handbrake: this.isActionActive('handbrake'),
      nitro: this.isActionActive('nitro'),
      reset: this.isActionActive('reset')
    };
  }
}
