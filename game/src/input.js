// Keyboard, mouse and touch controls in one place. The game reads held keys every
// step and edge-triggered presses (jump, hide, restart) once, so a held key never
// fires twice and a tap is never lost between frames.

export class InputControls {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.clickedButton = null;
    this.anyGesture = false;

    window.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.held.add(event.code);
      this.anyGesture = true;
    });
    window.addEventListener('keyup', (event) => {
      this.held.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.held.clear();
    });

    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
      this.mouseDown = true;
      this.anyGesture = true;
    });
    window.addEventListener('pointerup', (event) => {
      // Record the click at once: a quick tap can finish between two frames,
      // and a poll that only watches the held state would miss it entirely.
      if (this.mouseDown) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (canvas.height / rect.height);
        this.clickedButton = { x, y };
      }
      this.mouseDown = false;
    });
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      this.anyGesture = true;
    }, { passive: false });
  }

  isHeld(code) {
    return this.held.has(code);
  }

  /** True once for the frame the key went down; the game consumes it each step. */
  wasPressed(code) {
    return this.pressed.has(code);
  }

  left() {
    return this.isHeld('ArrowLeft') || this.isHeld('KeyA');
  }

  right() {
    return this.isHeld('ArrowRight') || this.isHeld('KeyD');
  }

  jumpPressed() {
    return this.wasPressed('Space') || this.wasPressed('ArrowUp') || this.wasPressed('KeyW');
  }

  hideHeld() {
    return this.isHeld('ArrowDown') || this.isHeld('KeyS');
  }

  sprintHeld() {
    return this.isHeld('ShiftLeft') || this.isHeld('ShiftRight');
  }

  restartPressed() {
    return this.wasPressed('KeyR') || this.wasPressed('Enter');
  }

  startPressed() {
    return this.wasPressed('Enter') || this.wasPressed('Space');
  }

  pausePressed() {
    return this.wasPressed('KeyP') || this.wasPressed('Escape');
  }

  mutePressed() {
    return this.wasPressed('KeyM');
  }

  /** A click inside a rectangle, in logical canvas coordinates. */
  clickedIn(rect) {
    if (!this.clickedButton) return false;
    const hit = this.clickedButton.x >= rect.x && this.clickedButton.x <= rect.x + rect.width
      && this.clickedButton.y >= rect.y && this.clickedButton.y <= rect.y + rect.height;
    return hit;
  }

  /** The game calls this after each step so presses do not leak into the next frame. */
  endFrame(clickConsumed) {
    this.pressed.clear();
    if (clickConsumed) this.clickedButton = null;
  }

  /** True when a click was recorded since the last frame; the menus consume it. */
  pollClick() {
    return this.clickedButton !== null;
  }
}
