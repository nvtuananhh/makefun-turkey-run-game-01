// The farmer who chases the turkey: he runs after it, searches the haystacks when it
// hides, and corners it when it dawdles. Three states, one job: close the gap.

import { FARMER, FIELD } from './config.js';

export const FARMER_CHASE = 'chase';
export const FARMER_SEARCH = 'search';
export const FARMER_STALK = 'stalk';

/** How far behind the turkey the farmer starts, in pixels. */
const START_GAP = 260;

export class FarmerChase {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 120;
    this.y = FIELD.groundY - FARMER.height;
    this.state = FARMER_CHASE;
    this.suspicion = 0;
    this.searchTimer = 0;
    this.searchDirection = 1;
    this.searchTargetX = 0;
    this.spotted = false;
    this.lungeTimer = 0;
    this.runCycle = 0;
    this.shoutTimer = 0;
  }

  /** Distance, in pixels, between the farmer and the turkey. */
  gapTo(turkeyX) {
    return turkeyX - this.x;
  }

  /** The turkey is hidden and the farmer has lost the trail. */
  loseTrail(haystackX) {
    if (this.state === FARMER_CHASE) {
      this.state = FARMER_SEARCH;
      this.searchTimer = FARMER.searchTime;
      this.searchTargetX = haystackX;
      this.suspicion = 0.7;
    }
  }

  /** The farmer catches a glimpse: suspicion jumps and he sprints. */
  spotTurkey() {
    this.suspicion = 1;
    if (this.state === FARMER_SEARCH) this.state = FARMER_CHASE;
    if (!this.spotted) {
      this.spotted = true;
      this.shoutTimer = 0.9;
      return true;
    }
    return false;
  }

  update(dt, turkey, stageIndex, hidden, scrollRate) {
    const scroll = scrollRate || 0;
    const gap = this.gapTo(turkey.x);
    this.runCycle += dt * 11;
    if (this.shoutTimer > 0) this.shoutTimer -= dt;

    if (this.state === FARMER_SEARCH) {
      this.searchTimer -= dt;
      this.suspicion = Math.max(0, this.suspicion - FARMER.suspicionDecay * dt);
      const target = this.searchTargetX + Math.sin(this.searchTimer * 2.2) * 90;
      const direction = target > this.x ? 1 : -1;
      this.x += (direction * FARMER.walkSpeed * 0.6 - scroll) * dt;
      // He searches the haystack itself: if he reaches a hidden turkey, he finds it.
      if (hidden && Math.abs(this.x - turkey.x) < 60) {
        this.state = FARMER_CHASE;
        if (this.spotTurkey()) return 'spotted';
      }
      if (this.searchTimer <= 0) {
        this.state = FARMER_CHASE;
        this.spotted = false;
      }
      if (!hidden && gap < 420) {
        if (this.spotTurkey()) return 'spotted';
      }
      return null;
    }

    // Chase: a spring around a 260-pixel gap — the farmer runs faster than the
    // scroll when he is far behind and slower when he is close, so the gap
    // hovers where the turkey can see him while running, closes fast when the
    // turkey dawdles, and opens when it sprints. His base pace grows per stage.
    let speed = FARMER.chaseSpeed + (gap - 260) + stageIndex * 12;
    speed = Math.max(150, Math.min(560, speed));

    // Cornering: when the farmer is almost on the turkey, he lunges.
    if (gap < 130) {
      this.lungeTimer = 0.45;
    }
    if (this.lungeTimer > 0) {
      this.lungeTimer -= dt;
      speed = FARMER.lungeSpeed;
    }

    this.x += (speed - scroll) * dt;
    // He never falls hopelessly behind: a shortcut through the field brings him
    // back to just off-screen, panting but still in the hunt.
    if (this.gapTo(turkey.x) > FARMER.maxGap) {
      this.x = turkey.x - FARMER.maxGap;
    }
    if (hidden) {
      this.loseTrail(turkey.x);
      return null;
    }
    if (gap > 430) {
      if (this.spotTurkey()) return 'spotted';
    } else if (gap < 300) {
      this.spotted = false;
    }
    return null;
  }

  /** True when the farmer's hands reach the turkey. */
  catches(turkey) {
    return this.gapTo(turkey.x) < FARMER.catchDistance
      && Math.abs(this.y - turkey.y) < 70;
  }

  /** Where the farmer starts relative to the turkey on a fresh run. */
  placeBehind(turkeyX) {
    this.x = Math.max(40, turkeyX - START_GAP);
  }
}
