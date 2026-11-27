// Every tuning number, stage and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size. Distances are in metres of the turkey's escape run.

export const FIELD = { width: 1280, height: 720, groundY: 618 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The full escape: farmyard, then barn, then the kitchen, then freedom. */
export const ESCAPE_DISTANCE = 1400;

export const STAGES = [
  {
    name: 'STAGE 1 — THE FARMYARD',
    start: 0,
    end: 400,
    skyTop: '#f7b267',
    skyBottom: '#f4845f',
    sun: '#ffd166',
    ground: '#7a5230',
    grass: '#5d8a3c',
    hint: 'Run! The farmer is right behind you.',
  },
  {
    name: 'STAGE 2 — THE BARN',
    start: 400,
    end: 900,
    skyTop: '#8a5a44',
    skyBottom: '#c97b4a',
    sun: '#ffb703',
    ground: '#6b4423',
    grass: '#4a6b2f',
    hint: 'Hide in a haystack when the farmer closes in.',
  },
  {
    name: 'STAGE 3 — THE KITCHEN',
    start: 900,
    end: 1400,
    skyTop: '#3d2b3d',
    skyBottom: '#7a3b2e',
    sun: '#ff9f1c',
    ground: '#5c3a21',
    grass: '#8a5a2b',
    hint: 'The oven is lit. Jump the flames — freedom is past the back door!',
  },
];

export const TURKEY = {
  width: 74,
  height: 58,
  runSpeed: 300,
  sprintSpeed: 420,
  accel: 2600,
  jumpSpeed: 820,
  gravity: 1700,
  hideTime: 0.4,
};

export const FARMER = {
  width: 66,
  height: 96,
  walkSpeed: 200,
  chaseSpeed: 300,
  sprintSpeed: 330,
  lungeSpeed: 480,
  catchDistance: 52,
  searchTime: 2.6,
  suspicionDecay: 0.45,
  maxGap: 520,
};

export const LIVES = 3;

export const KNIFE = {
  width: 26,
  height: 64,
  fallSpeed: 520,
  fallSpeedPerStage: 90,
  warnTime: 0.55,
  interval: 1.9,
  intervalPerStage: -0.35,
  minInterval: 0.85,
  nearMissPoints: 5,
  nearMissDistance: 90,
};

export const CORN = {
  size: 26,
  points: 10,
  goldenPoints: 25,
  interval: 1.5,
};

export const HAZARD = {
  fenceWidth: 46,
  fenceHeight: 64,
  pumpkinWidth: 58,
  pumpkinHeight: 44,
  pinWidth: 64,
  pinHeight: 22,
  pinSpeed: 340,
  ovenWidth: 110,
  ovenHeight: 96,
  flameHeight: 70,
  interval: 2.4,
  intervalPerStage: -0.4,
  minInterval: 1.3,
};

export const HAYSTACK = {
  width: 96,
  height: 74,
  interval: 7.5,
};

export const SCORING = {
  perMetre: 1,
  stageBonus: 150,
  escapeBonus: 500,
};

export const PALETTE = {
  turkeyBody: '#8a5230',
  turkeyWing: '#6b3f24',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c', '#7a3b1e'],
  turkeyHead: '#e8e3d8',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#f2a541',
  turkeyLeg: '#e07b39',
  farmerShirt: '#c0392b',
  farmerOveralls: '#2e5fa3',
  farmerSkin: '#e8b88a',
  farmerHat: '#7a5c2e',
  farmerBoot: '#4a3220',
  knifeBlade: '#dfe5ec',
  knifeHandle: '#5c3a21',
  corn: '#f2c94c',
  cornGolden: '#ffd700',
  ovenBody: '#3a3a3a',
  ovenGlow: '#ff6b1a',
  flame: ['#ffd166', '#ff9f1c', '#ef476f'],
  panel: 'rgba(43, 24, 12, 0.88)',
  panelBorder: '#f2a541',
  text: '#fff3e0',
  textDark: '#2b180c',
  muted: '#e8b88a',
  danger: '#ef476f',
  safe: '#7bc96f',
  hudBar: '#ffd166',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const DISPLAY_FONT = 'Georgia, "Times New Roman", serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobbles-great-escape.best';

/** Seeded random generator so screenshot scenes are reproducible. */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Which stage a distance belongs to, and how far through it the run is. */
export function stageFor(distance) {
  for (let index = 0; index < STAGES.length; index += 1) {
    if (distance < STAGES[index].end) return { index, stage: STAGES[index] };
  }
  return { index: STAGES.length - 1, stage: STAGES[STAGES.length - 1] };
}
