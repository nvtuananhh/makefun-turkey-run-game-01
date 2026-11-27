// The game itself: the state machine (title, play, caught, escaped, paused), the
// fixed-step loop, the wiring between input, world, farmer, sound and renderer,
// and the ?shot= scenes the screenshots are taken from.

import { BEST_KEY, FIELD, STEP } from './config.js';
import { GobbleSoundBank } from './audio.js';
import { InputControls } from './input.js';
import { FarmerChase } from './farmer.js';
import { EscapeWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_HIDDEN, EVENT_HIT, EVENT_NEAR_MISS, EVENT_PICKUP, EVENT_SPOTTED, EVENT_STAGE } from './world.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, drawGame } from './render.js';
import { stageShot } from './shots.js';

const START_BUTTON = { x: 490, y: 448, width: 300, height: 52 };
const RESTART_BUTTON = { x: 490, y: 408, width: 300, height: 52 };
const ESCAPED_RESTART_BUTTON = { x: 490, y: 398, width: 300, height: 52 };

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch (error) {
    // Private mode: the best score simply does not persist.
  }
}

function fitCanvas(canvas) {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

export class GobbleGame {
  constructor(canvas, status) {
    this.canvas = canvas;
    this.status = status;
    this.ctx = canvas.getContext('2d');
    this.world = new EscapeWorld(20261127);
    this.farmer = new FarmerChase();
    this.farmer.placeBehind(this.world.turkey.x);
    this.sounds = new GobbleSoundBank();
    this.input = new InputControls(canvas);
    this.screen = SCREEN_TITLE;
    this.best = loadBest();
    this.time = 0;
    this.accumulator = 0;
    this.lastFrame = 0;
    this.shotMode = null;
    this.announced = '';
  }

  announce(text) {
    if (text === this.announced) return;
    this.announced = text;
    this.status.textContent = text;
  }

  startRun() {
    this.world.reset();
    this.farmer.reset();
    this.farmer.placeBehind(this.world.turkey.x);
    this.world.showMessage('STAGE 1 — THE FARMYARD — Run!', 2.6);
    this.screen = SCREEN_PLAY;
    this.sounds.unlock();
    this.sounds.gobble();
    this.sounds.startMusic();
    this.announce('The escape has begun. Run from the farmer, jump the fences, dodge the knives.');
  }

  finishRun(escaped) {
    this.screen = escaped ? SCREEN_ESCAPED : SCREEN_CAUGHT;
    this.sounds.stopMusic();
    const finalScore = Math.floor(this.world.score);
    if (finalScore > this.best) {
      this.best = finalScore;
      saveBest(this.best);
    }
    if (escaped) {
      this.sounds.escaped();
      this.announce(`Escaped! Final score ${finalScore}. Press R to run again.`);
    } else {
      this.sounds.caught();
      this.announce(`Caught! Final score ${finalScore}. Press R to run again.`);
    }
  }

  handleEvents(events) {
    if (events & EVENT_PICKUP) this.sounds.pickup(false);
    if (events & EVENT_NEAR_MISS) this.sounds.nearMiss();
    if (events & EVENT_HIT) {
      this.sounds.hit();
      this.announce(`Ouch! ${this.world.lives} ${this.world.lives === 1 ? 'life' : 'lives'} left.`);
    }
    if (events & EVENT_STAGE) {
      this.sounds.stageClear();
      this.announce(this.world.message);
    }
    if (events & EVENT_HIDDEN) {
      this.announce('Hidden in the haystack. The farmer is searching.');
    }
    if (events & EVENT_SPOTTED) this.sounds.alarm();
    if (events & EVENT_ESCAPED) this.finishRun(true);
    else if (events & EVENT_CAUGHT) this.finishRun(false);
  }

  stepPlay() {
    const input = this.input;
    const move = (input.right() ? 1 : 0) - (input.left() ? 1 : 0);
    const jump = input.jumpPressed();
    const events = this.world.step(STEP, move, jump, input.hideHeld(), input.sprintHeld(), this.farmer);
    const spotted = this.farmer.update(STEP, this.world.turkey, this.world.stageIndex, this.world.turkey.hidden, this.world.scrollRate);
    if (spotted === 'spotted') {
      this.sounds.alarm();
      this.announce('Spotted! The farmer is sprinting after you!');
    }
    this.handleEvents(events);
    if (input.pausePressed()) {
      this.screen = SCREEN_PAUSED;
      this.sounds.stopMusic();
    }
  }

  stepTitle() {
    // The title scene idles: the turkey stands and the farmer looms behind it.
    // The world steps with no farmer, so the idle scene can never be caught.
    this.world.step(STEP, 0, false, false, false, null);
    const clicked = this.input.pollClick();
    if (this.input.startPressed() || (clicked && this.input.clickedIn(START_BUTTON))) {
      this.input.endFrame(true);
      this.startRun();
      return;
    }
    this.input.endFrame(clicked);
  }

  stepEnd() {
    const clicked = this.input.pollClick();
    const button = this.screen === SCREEN_ESCAPED ? ESCAPED_RESTART_BUTTON : RESTART_BUTTON;
    if (this.input.restartPressed() || (clicked && this.input.clickedIn(button))) {
      this.input.endFrame(true);
      this.startRun();
      return;
    }
    this.input.endFrame(clicked);
  }

  stepPaused() {
    if (this.input.pausePressed() || this.input.pollClick()) {
      this.input.endFrame(true);
      this.screen = SCREEN_PLAY;
      this.sounds.startMusic();
      return;
    }
    this.input.endFrame(false);
  }

  frame(timestamp) {
    if (this.shotMode) return;
    if (!this.lastFrame) this.lastFrame = timestamp;
    let elapsed = (timestamp - this.lastFrame) / 1000;
    this.lastFrame = timestamp;
    if (elapsed > 0.25) elapsed = 0.25;
    this.accumulator += elapsed;
    while (this.accumulator >= STEP) {
      this.accumulator -= STEP;
      this.time += STEP;
      if (this.input.mutePressed()) {
        const muted = this.sounds.toggleMute();
        this.announce(muted ? 'Sound off.' : 'Sound on.');
      }
      if (this.screen === SCREEN_TITLE) this.stepTitle();
      else if (this.screen === SCREEN_PLAY) this.stepPlay();
      else if (this.screen === SCREEN_PAUSED) this.stepPaused();
      else this.stepEnd();
      if (this.screen === SCREEN_PLAY && this.world.over) break;
    }
    this.input.endFrame(false);
    drawGame(this.ctx, this.screen, this.world, this.farmer, this.best, this.time);
    window.requestAnimationFrame((next) => this.frame(next));
  }

  /** A ?shot= scene: stage it once, draw it once, and hold the frame still. */
  stageScreenshotScene(name) {
    this.shotMode = name;
    const staged = stageShot(name, this.world, this.farmer);
    this.screen = staged.screen;
    this.best = staged.best;
    this.time = 4;
    drawGame(this.ctx, this.screen, this.world, this.farmer, this.best, this.time);
    this.announce(`Gobble's Great Escape, ${name} scene.`);
  }

  start() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      this.stageScreenshotScene(shot);
      return;
    }
    fitCanvas(this.canvas);
    window.addEventListener('resize', () => fitCanvas(this.canvas));
    this.announce("Gobble's Great Escape. Press Enter to start the escape.");
    window.requestAnimationFrame((next) => this.frame(next));
  }
}

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = new GobbleGame(canvas, status);
// Exposed for debugging and automated play-tests; the game never reads it back.
window.__gobbleGame = game;
game.start();
