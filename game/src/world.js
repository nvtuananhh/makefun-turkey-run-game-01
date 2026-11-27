// The escape run itself: the turkey's movement, the scrolling world, the spawning
// of fences, pumpkins, rolling pins, ovens, knives, corn and haystacks, and every
// collision. One step advances the world a fixed amount and reports what happened.

import {
  CORN, ESCAPE_DISTANCE, FARMER, FIELD, HAYSTACK, HAZARD, KNIFE, LIVES,
  SCORING, STEP, TURKEY, mulberry32, stageFor,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_STAGE = 16;
export const EVENT_NEAR_MISS = 32;
export const EVENT_HIDDEN = 64;
export const EVENT_SPOTTED = 128;

const KIND_FENCE = 'fence';
const KIND_PUMPKIN = 'pumpkin';
const KIND_PIN = 'pin';
const KIND_OVEN = 'oven';

export class EscapeWorld {
  constructor(seed) {
    this.random = mulberry32(seed || 20261127);
    this.reset();
  }

  reset() {
    this.random = mulberry32(20261127);
    this.time = 0;
    this.distance = 0;
    this.score = 0;
    this.cornCollected = 0;
    this.nearMisses = 0;
    this.lives = LIVES;
    this.stageIndex = 0;
    this.over = false;
    this.escaped = false;
    this.invulnerable = 0;
    this.stumbleTimer = 0;
    this.hazardTimer = 1.6;
    this.knifeTimer = 2.2;
    this.cornTimer = 0.9;
    this.hayTimer = 3.5;
    this.flashTimer = 0;
    this.message = '';
    this.messageTimer = 0;
    this.turkey = {
      x: 300,
      y: FIELD.groundY - TURKEY.height,
      vy: 0,
      onGround: true,
      hidden: false,
      hiding: false,
      sprinting: false,
      runCycle: 0,
      facing: 1,
      hideX: 0,
    };
    this.farmerStartX = 40;
    this.hazards = [];
    this.knives = [];
    this.corns = [];
    this.haystacks = [];
    this.particles = [];
    this.warnings = [];
    this.best = 0;
  }

  get stage() {
    return stageFor(this.distance);
  }

  showMessage(text, seconds) {
    this.message = text;
    this.messageTimer = seconds || 2.2;
  }

  spawnHazard() {
    const roll = this.random();
    const stage = this.stageIndex;
    let kind = KIND_FENCE;
    if (stage === 2 && roll < 0.45) kind = KIND_OVEN;
    else if (roll < 0.3) kind = KIND_PUMPKIN;
    else if (roll < 0.55 && stage >= 1) kind = KIND_PIN;
    const x = FIELD.width + 60;
    if (kind === KIND_FENCE) {
      this.hazards.push({ kind, x, y: FIELD.groundY - HAZARD.fenceHeight, width: HAZARD.fenceWidth, height: HAZARD.fenceHeight, passed: false });
    } else if (kind === KIND_PUMPKIN) {
      this.hazards.push({ kind, x, y: FIELD.groundY - HAZARD.pumpkinHeight, width: HAZARD.pumpkinWidth, height: HAZARD.pumpkinHeight, passed: false });
    } else if (kind === KIND_PIN) {
      this.hazards.push({ kind, x, y: FIELD.groundY - HAZARD.pinHeight, width: HAZARD.pinWidth, height: HAZARD.pinHeight, vx: -HAZARD.pinSpeed, passed: false });
    } else {
      this.hazards.push({ kind, x, y: FIELD.groundY - HAZARD.ovenHeight, width: HAZARD.ovenWidth, height: HAZARD.ovenHeight, flame: 0, passed: false });
    }
  }

  spawnKnife() {
    const x = 320 + this.random() * 820;
    this.warnings.push({ x, timer: KNIFE.warnTime });
  }

  spawnCorn() {
    const golden = this.random() < 0.18;
    this.corns.push({
      x: FIELD.width + 40,
      y: FIELD.groundY - 40 - this.random() * 120,
      size: CORN.size,
      golden,
      bob: this.random() * 6.28,
    });
  }

  spawnHaystack() {
    this.haystacks.push({
      x: FIELD.width + 40,
      y: FIELD.groundY - HAYSTACK.height,
      width: HAYSTACK.width,
      height: HAYSTACK.height,
    });
  }

  burst(x, y, colour, count) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x, y,
        vx: (this.random() - 0.5) * 320,
        vy: -this.random() * 260,
        life: 0.6 + this.random() * 0.4,
        colour,
        size: 3 + this.random() * 5,
      });
    }
  }

  overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x
      && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  turkeyBox() {
    return { x: this.turkey.x, y: this.turkey.y, width: TURKEY.width, height: TURKEY.height };
  }

  takeHit(sourceX, sourceY) {
    if (this.invulnerable > 0 || this.over) return EVENT_NONE;
    this.lives -= 1;
    this.invulnerable = 1.4;
    this.flashTimer = 0.35;
    this.burst(sourceX, sourceY, '#ef476f', 14);
    if (this.lives <= 0) {
      this.over = true;
      this.escaped = false;
      return EVENT_HIT | EVENT_CAUGHT;
    }
    return EVENT_HIT;
  }

  /** Advance the world one fixed step. Returns the event flags for this step. */
  step(dt, move, jump, hideHeld, sprintHeld, farmer) {
    if (this.over) return EVENT_NONE;
    this.time += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;

    const turkey = this.turkey;
    const stage = this.stage;
    if (stage.index !== this.stageIndex) {
      this.stageIndex = stage.index;
      this.showMessage(`${stage.stage.name} — ${stage.stage.hint}`, 2.6);
      this.score += SCORING.stageBonus;
      return EVENT_STAGE;
    }

    // Hiding: duck into a haystack and the farmer loses the trail.
    let hiding = false;
    if (hideHeld && turkey.onGround) {
      for (const hay of this.haystacks) {
        if (Math.abs(turkey.x + TURKEY.width / 2 - (hay.x + hay.width / 2)) < hay.width) {
          hiding = true;
          turkey.hideX = hay.x;
          break;
        }
      }
    }
    const wasHidden = turkey.hidden;
    turkey.hidden = hiding;
    turkey.hiding = hiding;
    let events = EVENT_NONE;
    if (hiding && !wasHidden) events |= EVENT_HIDDEN;

    // Movement: the turkey cruises around mid-screen instead of running off the
    // right edge — holding right scrolls the world past, dawdling lets the
    // farmer close in, and backing off gives ground back to him.
    const speed = sprintHeld ? TURKEY.sprintSpeed : TURKEY.runSpeed;
    turkey.sprinting = sprintHeld && move !== 0;
    const cruiseX = move > 0 ? 520 : move < 0 ? 160 : 300;
    if (!hiding) {
      const step = Math.max(-speed * dt, Math.min(speed * dt, cruiseX - turkey.x));
      turkey.x += step;
      if (move !== 0) turkey.facing = move;
      if (jump && turkey.onGround) {
        turkey.vy = -TURKEY.jumpSpeed;
        turkey.onGround = false;
      }
    }
    turkey.vy += TURKEY.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= FIELD.groundY - TURKEY.height) {
      turkey.y = FIELD.groundY - TURKEY.height;
      turkey.vy = 0;
      turkey.onGround = true;
    }
    turkey.runCycle += dt * (turkey.sprinting ? 16 : 11) * (move === 0 ? 0.2 : 1);

    // The world scrolls past only while the turkey runs: standing still gains
    // little ground, and the farmer keeps closing in. The scroll rate is in
    // pixels per second; the farmer's chase is measured against it.
    const scrollRate = hiding ? 0 : move > 0 ? speed * 0.9 + 40 : move < 0 ? 50 : 150;
    const scroll = scrollRate * dt;
    this.scrollRate = scrollRate;
    if (!hiding) {
      this.distance += scroll * 0.09;
      this.score += scroll * 0.09 * SCORING.perMetre;
    }

    // Spawning, paced by stage: more knives and hazards the deeper the escape goes.
    const knifeInterval = Math.max(KNIFE.minInterval, KNIFE.interval + KNIFE.intervalPerStage * this.stageIndex);
    this.knifeTimer -= dt;
    if (this.knifeTimer <= 0) {
      this.knifeTimer = knifeInterval * (0.8 + this.random() * 0.5);
      this.spawnKnife();
    }
    const hazardInterval = Math.max(HAZARD.minInterval, HAZARD.interval + HAZARD.intervalPerStage * this.stageIndex);
    this.hazardTimer -= dt;
    if (this.hazardTimer <= 0) {
      this.hazardTimer = hazardInterval * (0.85 + this.random() * 0.4);
      this.spawnHazard();
    }
    this.cornTimer -= dt;
    if (this.cornTimer <= 0) {
      this.cornTimer = CORN.interval * (0.7 + this.random() * 0.8);
      this.spawnCorn();
    }
    this.hayTimer -= dt;
    if (this.hayTimer <= 0) {
      this.hayTimer = HAYSTACK.interval * (0.8 + this.random() * 0.5);
      this.spawnHaystack();
    }

    // Warnings become falling knives.
    for (let i = this.warnings.length - 1; i >= 0; i -= 1) {
      const warning = this.warnings[i];
      warning.timer -= dt;
      if (warning.timer <= 0) {
        this.knives.push({
          x: warning.x, y: -KNIFE.height,
          width: KNIFE.width, height: KNIFE.height,
          vy: KNIFE.fallSpeed + KNIFE.fallSpeedPerStage * this.stageIndex,
          scored: false,
        });
        this.warnings.splice(i, 1);
      }
    }

    // Move everything left with the scroll; pins roll back faster.
    for (const hazard of this.hazards) {
      hazard.x -= scroll;
      if (hazard.kind === KIND_PIN) hazard.x -= HAZARD.pinSpeed * dt;
      if (hazard.kind === KIND_OVEN) hazard.flame = (hazard.flame + dt * 9) % 6.28;
    }
    for (const corn of this.corns) {
      corn.x -= scroll;
      corn.bob += dt * 5;
    }
    for (const hay of this.haystacks) hay.x -= scroll;
    for (const knife of this.knives) knife.y += knife.vy * dt;
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Cull what scrolled away.
    this.hazards = this.hazards.filter((h) => h.x + h.width > -80);
    this.corns = this.corns.filter((c) => c.x > -60);
    this.haystacks = this.haystacks.filter((h) => h.x + h.width > -80);
    this.knives = this.knives.filter((k) => k.y < FIELD.height + 40);

    if (!hiding && this.invulnerable <= 0) {
      const box = this.turkeyBox();
      // Ground hazards: fences and pumpkins must be jumped; pins and ovens hurt.
      for (const hazard of this.hazards) {
        if (!hazard.passed && hazard.x + hazard.width < turkey.x) {
          hazard.passed = true;
          this.score += 2;
        }
        if (this.overlaps(box, hazard)) {
          if (hazard.kind === KIND_FENCE || hazard.kind === KIND_PUMPKIN) {
            if (turkey.onGround) {
              this.stumbleTimer = 0.5;
              turkey.x -= 60;
              events |= this.takeHit(hazard.x, hazard.y);
            }
          } else {
            events |= this.takeHit(hazard.x, hazard.y);
            turkey.x -= 40;
          }
          if (this.over) return events | EVENT_CAUGHT;
        }
      }
      // Falling carving knives.
      for (const knife of this.knives) {
        if (!knife.scored && knife.y > FIELD.groundY) {
          knife.scored = true;
          if (Math.abs(knife.x + knife.width / 2 - (turkey.x + TURKEY.width / 2)) < KNIFE.nearMissDistance) {
            this.nearMisses += 1;
            this.score += KNIFE.nearMissPoints;
            events |= EVENT_NEAR_MISS;
          }
        }
        if (this.overlaps(box, knife)) {
          events |= this.takeHit(knife.x, knife.y);
          knife.y = FIELD.height + 100;
          if (this.over) return events | EVENT_CAUGHT;
        }
      }
    }

    // Corn: the reason to risk a detour.
    const box = this.turkeyBox();
    for (let i = this.corns.length - 1; i >= 0; i -= 1) {
      const corn = this.corns[i];
      const cornBox = { x: corn.x - corn.size / 2, y: corn.y - corn.size / 2, width: corn.size, height: corn.size };
      if (this.overlaps(box, cornBox)) {
        this.corns.splice(i, 1);
        this.cornCollected += 1;
        this.score += corn.golden ? CORN.goldenPoints : CORN.points;
        this.burst(corn.x, corn.y, corn.golden ? '#ffd700' : '#f2c94c', 8);
        events |= EVENT_PICKUP;
      }
    }

    // Caught by the farmer — never while hidden in the hay — or free at last.
    if (farmer && !turkey.hidden && farmer.catches(turkey)) {
      this.over = true;
      this.escaped = false;
      return events | EVENT_CAUGHT;
    }
    if (this.distance >= ESCAPE_DISTANCE) {
      this.over = true;
      this.escaped = true;
      this.score += SCORING.escapeBonus;
      return events | EVENT_ESCAPED;
    }
    return events;
  }
}
