// The screenshot scenes behind ?shot=title|play|kitchen|escaped|caught. Each one
// plays the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (run right, jump when a hazard is close, chase the
// lowest corn), so the frame is what a short game really looks like and the same
// seed always gives the same frame. The cover scene runs in the kitchen, where the
// oven, a falling knife, the farmer and the HUD are all in one frame.

import { STEP, TURKEY } from './config.js';
import { EVENT_CAUGHT, EVENT_ESCAPED } from './world.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 9;
const KITCHEN_SECONDS = 5;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** Seconds the autopilot looks ahead when it decides whether to jump. */
const HORIZON_PLAY = 0.5;
const HORIZON_CAUGHT = 0.12;

/** True when a hazard is close enough ahead that the turkey must jump now. Each
 * kind has its own trigger: the wide oven is jumped late, the rolling pin
 * earlier because it rolls towards the turkey. The horizon scales the triggers,
 * so the hurried pilot of the caught scene jumps far too late. */
function hazardAhead(world, horizon) {
  const turkey = world.turkey;
  if (!turkey.onGround) return false;
  const scale = horizon / HORIZON_PLAY;
  for (const hazard of world.hazards) {
    const base = hazard.kind === 'oven' ? 130 : hazard.kind === 'pin' ? 180 : 200;
    const gap = hazard.x - turkey.x;
    if (gap > 0 && gap < base * scale) return true;
  }
  return false;
}

function autopilot(world, farmer, horizon, allowSprint) {
  // Always run forward: chasing corn leftwards lets the farmer close in, so
  // the pilot only ever moves right — except to sidestep a falling knife,
  // which it dodges by stepping away from the knife's line.
  const turkey = world.turkey;
  let move = 1;
  for (const knife of world.knives) {
    if (knife.y > 0 && knife.y < 520
      && Math.abs(knife.x + knife.width / 2 - (turkey.x + TURKEY.width / 2)) < 70) {
      move = knife.x + knife.width / 2 > turkey.x + TURKEY.width / 2 ? -1 : 1;
      break;
    }
  }
  const jump = hazardAhead(world, horizon);
  const sprint = allowSprint !== false && farmer.gapTo(world.turkey.x) < 220;
  return { move, jump, hide: false, sprint };
}

function runForward(world, farmer, seconds, horizon, allowSprint) {
  for (let index = 0; index < seconds / STEP; index += 1) {
    const pilot = autopilot(world, farmer, horizon, allowSprint);
    const events = world.step(STEP, pilot.move, pilot.jump, pilot.hide, pilot.sprint, farmer);
    farmer.update(STEP, world.turkey, world.stageIndex, world.turkey.hidden, world.scrollRate);
    if (events & EVENT_CAUGHT || events & EVENT_ESCAPED) break;
  }
}

/**
 * Set `world` and `farmer` to the named scene and return the screen to draw over
 * it and the best score to show.
 */
export function stageShot(name, world, farmer) {
  world.reset();
  farmer.reset();
  farmer.placeBehind(world.turkey.x);
  if (name !== 'play' && name !== 'kitchen' && name !== 'escaped' && name !== 'caught') {
    // The title idles with the turkey standing and the farmer looming behind it:
    // step the world with no farmer, so the idle scene can never be caught.
    for (let index = 0; index < TITLE_SECONDS / STEP; index += 1) {
      world.step(STEP, 0, false, false, false, null);
    }
    return { screen: SCREEN_TITLE, best: 1250 };
  }
  if (name === 'kitchen') {
    // Jump the run straight into the kitchen, then play a few seconds there so
    // the oven, a knife and the farmer share the frame with the HUD.
    world.distance = 980;
    world.stageIndex = 2;
    world.knifeTimer = 0.4;
    world.hazardTimer = 0.5;
    runForward(world, farmer, KITCHEN_SECONDS, HORIZON_PLAY);
    // A run that ended caught shows its real end screen, never a live HUD
    // with no lives left.
    if (world.over) return { screen: SCREEN_CAUGHT, best: 1250 };
    return { screen: SCREEN_PLAY, best: 1250 };
  }
  if (name === 'escaped') {
    world.distance = 1330;
    world.stageIndex = 2;
    world.knifeTimer = 3;
    runForward(world, farmer, END_LIMIT_SECONDS, HORIZON_PLAY);
    return { screen: world.escaped ? SCREEN_ESCAPED : SCREEN_PLAY, best: 1250 };
  }
  if (name === 'caught') {
    // A hurried pilot: it jumps far too late and never sprints, so the farmer
    // and the knives catch up with it, as they do with a hurried player.
    runForward(world, farmer, END_LIMIT_SECONDS, HORIZON_CAUGHT, false);
    return { screen: world.over ? SCREEN_CAUGHT : SCREEN_PLAY, best: 1250 };
  }
  runForward(world, farmer, PLAY_SECONDS, HORIZON_PLAY);
  return { screen: SCREEN_PLAY, best: 1250 };
}
