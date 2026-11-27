// Everything the player sees, drawn on one canvas with vector art: the autumn farm
// and kitchen, the turkey, the farmer, the hazards, the HUD and every menu screen.
// Nothing is loaded from a file, so the scene is identical offline and online.

import { FIELD, PALETTE, FONT, DISPLAY_FONT, STAGES, FARMER, TURKEY, ESCAPE_DISTANCE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_PAUSED = 'paused';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, font, align, weight) {
  ctx.fillStyle = colour;
  ctx.font = `${weight || 700} ${size}px ${font || FONT}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function panel(ctx, x, y, width, height) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, width, height, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelBorder;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawSun(ctx, stage, time) {
  ctx.fillStyle = stage.sun;
  ctx.beginPath();
  ctx.arc(1080, 110 + Math.sin(time * 0.3) * 6, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(1080, 110, 68, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255, 243, 224, 0.85)';
  ctx.beginPath();
  ctx.arc(x, y, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x + 28 * scale, y - 8 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 56 * scale, y, 24 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarn(ctx, x, y, scale) {
  ctx.fillStyle = '#a63d2f';
  ctx.fillRect(x, y, 220 * scale, 150 * scale);
  ctx.fillStyle = '#7a2b20';
  ctx.beginPath();
  ctx.moveTo(x - 12 * scale, y);
  ctx.lineTo(x + 110 * scale, y - 70 * scale);
  ctx.lineTo(x + 232 * scale, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2e3c9';
  ctx.fillRect(x + 88 * scale, y + 78 * scale, 44 * scale, 72 * scale);
  ctx.strokeStyle = '#f2e3c9';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 88 * scale, y + 78 * scale);
  ctx.lineTo(x + 132 * scale, y + 150 * scale);
  ctx.moveTo(x + 132 * scale, y + 78 * scale);
  ctx.lineTo(x + 88 * scale, y + 150 * scale);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x + 110 * scale, y + 34 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawFence(ctx, x, y) {
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + 90, y - 34);
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x + 90, y - 14);
  ctx.stroke();
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(x + 6, y - 46, 9, 46);
  ctx.fillRect(x + 74, y - 46, 9, 46);
}

function drawPumpkin(ctx, x, y, size) {
  ctx.fillStyle = '#e07b39';
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b85c1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.55, size * 0.78, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#4a6b2f';
  ctx.fillRect(x - 3, y - size * 0.78 - 8, 7, 10);
}

function drawHaystack(ctx, x, y, width, height) {
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.quadraticCurveTo(x + width / 2, y - height * 0.5, x + width, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a67c2e';
  ctx.lineWidth = 3;
  for (let i = 1; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + (width * i) / 5, y + height - 6);
    ctx.quadraticCurveTo(x + (width * i) / 5 + 8, y + height * 0.3, x + (width * i) / 5, y + 4);
    ctx.stroke();
  }
}

function drawOven(ctx, x, y, width, height, flamePhase, time) {
  ctx.fillStyle = PALETTE.ovenBody;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.fillStyle = '#222';
  roundRect(ctx, x + 14, y + 16, width - 28, height - 52, 8);
  ctx.fill();
  const glow = 0.55 + 0.45 * Math.sin(flamePhase + time * 2);
  ctx.fillStyle = `rgba(255, 107, 26, ${0.55 + glow * 0.4})`;
  roundRect(ctx, x + 20, y + 22, width - 40, height - 64, 6);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const flameHeight = 26 + 14 * Math.sin(flamePhase + i * 2.1 + time * 6);
    ctx.fillStyle = PALETTE.flame[i % PALETTE.flame.length];
    ctx.beginPath();
    ctx.ellipse(x + width / 2 + (i - 1) * 34, y + height - 34 - flameHeight / 2, 12, flameHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#dfe5ec';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 30 + i * 26, y + 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'HOT!', x + width / 2, y - 16, 18, '#ffd166', FONT, 'center', 800);
}

function drawRollingPin(ctx, x, y, width, height, time) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(Math.sin(time * 8) * 0.08);
  ctx.fillStyle = '#c9a06a';
  roundRect(ctx, -width / 2, -height / 2, width, height, 10);
  ctx.fill();
  ctx.fillStyle = '#8a6a42';
  ctx.fillRect(-width / 2 - 10, -5, 12, 10);
  ctx.fillRect(width / 2 - 2, -5, 12, 10);
  ctx.restore();
}

function drawKnife(ctx, x, y, width, height) {
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.45);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x + width, y + height * 0.45);
  ctx.lineTo(x + width, y + height * 0.7);
  ctx.lineTo(x, y + height * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.knifeHandle;
  roundRect(ctx, x + 3, y + height * 0.7, width - 6, height * 0.3, 4);
  ctx.fill();
}

function drawCorn(ctx, x, y, size, golden, bob) {
  const lift = Math.sin(bob) * 4;
  ctx.fillStyle = golden ? PALETTE.cornGolden : PALETTE.corn;
  ctx.beginPath();
  ctx.ellipse(x, y + lift, size / 2, size * 0.72, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = golden ? '#b8860b' : '#b8860b';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * 6, y + lift - size * 0.6);
    ctx.lineTo(x + i * 6, y + lift + size * 0.6);
    ctx.stroke();
  }
  ctx.fillStyle = '#7bc96f';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + lift - size * 0.7);
  ctx.lineTo(x + 10, y + lift - size - 6);
  ctx.lineTo(x + 8, y + lift - size * 0.55);
  ctx.closePath();
  ctx.fill();
}

export function drawTurkey(ctx, turkey, time) {
  const legSwing = Math.sin(turkey.runCycle) * 10;
  const bodyY = turkey.y + 16 + (turkey.onGround ? Math.abs(Math.sin(turkey.runCycle)) * -3 : 0);
  ctx.save();
  if (turkey.hidden) {
    ctx.globalAlpha = 0;
    ctx.restore();
    return;
  }
  if (turkey.facing < 0) {
    ctx.translate(turkey.x + TURKEY.width, bodyY);
    ctx.scale(-1, 1);
    ctx.translate(-turkey.x, -bodyY);
  }
  // Legs, running — tucked up while the turkey is airborne.
  const footY = turkey.onGround ? FIELD.groundY : bodyY + 44;
  ctx.strokeStyle = PALETTE.turkeyLeg;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(turkey.x + 26, bodyY + 30);
  ctx.lineTo(turkey.x + 26 + legSwing, footY);
  ctx.moveTo(turkey.x + 44, bodyY + 30);
  ctx.lineTo(turkey.x + 44 - legSwing, footY);
  ctx.stroke();
  // Tail fan.
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = PALETTE.turkeyTail[i % PALETTE.turkeyTail.length];
    ctx.save();
    ctx.translate(turkey.x + 14, bodyY + 18);
    ctx.rotate(-0.9 + i * 0.45);
    ctx.beginPath();
    ctx.ellipse(0, -26, 10, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(turkey.x + 38, bodyY + 16, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWing;
  ctx.beginPath();
  ctx.ellipse(turkey.x + 34, bodyY + 18, 16, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Neck and head.
  ctx.strokeStyle = PALETTE.turkeyBody;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(turkey.x + 58, bodyY + 4);
  ctx.quadraticCurveTo(turkey.x + 66, bodyY - 12, turkey.x + 62, bodyY - 22);
  ctx.stroke();
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.beginPath();
  ctx.arc(turkey.x + 62, bodyY - 26, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak, wattle, eye — the face that reads at a glance.
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(turkey.x + 70, bodyY - 28);
  ctx.lineTo(turkey.x + 82, bodyY - 24);
  ctx.lineTo(turkey.x + 70, bodyY - 21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(turkey.x + 66, bodyY - 16, 4, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(turkey.x + 65, bodyY - 29, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFarmer(ctx, farmer, time) {
  const legSwing = Math.sin(farmer.runCycle) * 12;
  const x = farmer.x;
  const y = farmer.y;
  // Legs and boots.
  ctx.strokeStyle = PALETTE.farmerBoot;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 62);
  ctx.lineTo(x + 24 + legSwing, FIELD.groundY);
  ctx.moveTo(x + 44, y + 62);
  ctx.lineTo(x + 44 - legSwing, FIELD.groundY);
  ctx.stroke();
  // Overalls.
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(x + 16, y + 34, 36, 34);
  ctx.fillRect(x + 20, y + 58, 11, 12);
  ctx.fillRect(x + 37, y + 58, 11, 12);
  // Shirt and arms, one reaching for the turkey.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(x + 12, y + 22, 44, 22);
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x + 52, y + 30);
  ctx.lineTo(x + 72, y + 18 + Math.sin(time * 6) * 4);
  ctx.moveTo(x + 14, y + 30);
  ctx.lineTo(x + 2, y + 44);
  ctx.stroke();
  // Head, moustache and straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(x + 34, y + 12, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(x + 20, y + 12, 28, 5);
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(x + 34, y + 1, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 20, y - 12, 28, 13);
  // Angry eyes.
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(x + 30, y + 10, 2, 0, Math.PI * 2);
  ctx.arc(x + 40, y + 10, 2, 0, Math.PI * 2);
  ctx.fill();
  // Spotted! marker.
  if (farmer.spotted || farmer.shoutTimer > 0) {
    text(ctx, '!', x + 34, y - 34, 34, '#ff4757', DISPLAY_FONT, 'center', 900);
    text(ctx, 'HEY! COME BACK HERE!', x + 34, y - 58, 15, '#fff3e0', FONT, 'center', 800);
  }
  // Searching: a question mark while he hunts the haystacks.
  if (farmer.state === 'search') {
    text(ctx, '?', x + 34, y - 34, 30, '#ffd166', DISPLAY_FONT, 'center', 900);
  }
}

function drawBackground(ctx, stage, distance, time, stageIndex) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, stage.skyTop);
  gradient.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (stageIndex === 2) {
    // The kitchen: warm walls, a window, hanging pots and a checkered floor.
    ctx.fillStyle = '#6b3a2a';
    ctx.fillRect(0, 0, FIELD.width, 330);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(90, 70, 130, 150);
    ctx.fillStyle = '#7ec8e3';
    ctx.fillRect(100, 80, 110, 130);
    ctx.strokeStyle = '#6b3a2a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(155, 80);
    ctx.lineTo(155, 210);
    ctx.moveTo(100, 145);
    ctx.lineTo(210, 145);
    ctx.stroke();
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) {
      const px = 480 + i * 130;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, 46);
      ctx.stroke();
      ctx.fillStyle = '#2e2e2e';
      ctx.beginPath();
      ctx.arc(px, 62, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(0, 330, FIELD.width, FIELD.groundY - 330);
  } else {
    // Farmyard and barn: sun, clouds, rolling hills, a barn, fences and pumpkins.
    drawSun(ctx, stage, time);
    drawCloud(ctx, 180 + Math.sin(time * 0.1) * 20, 90, 1);
    drawCloud(ctx, 640, 60, 0.8);
    drawCloud(ctx, 900, 130, 0.7);
    ctx.fillStyle = stage.grass;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.quadraticCurveTo(320, 420, 640, 470);
    ctx.quadraticCurveTo(960, 520, 1280, 460);
    ctx.lineTo(1280, FIELD.height);
    ctx.lineTo(0, FIELD.height);
    ctx.closePath();
    ctx.fill();
    drawBarn(ctx, 60, 330, 0.9);
    drawFence(ctx, 420, 560);
    drawFence(ctx, 760, 560);
    drawPumpkin(ctx, 330, 600, 22);
    drawPumpkin(ctx, 1150, 604, 26);
    drawPumpkin(ctx, 1180, 610, 16);
    drawHaystack(ctx, 980, 560, 110, 58);
  }
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);
  if (stageIndex === 2) {
    ctx.fillStyle = '#c9a06a';
    for (let i = 0; i < 16; i += 1) {
      ctx.fillRect(i * 80 + ((i % 2) * 40), FIELD.groundY + 20, 40, 26);
    }
  }
}

function drawHud(ctx, world, best) {
  const stage = world.stage.stage;
  ctx.fillStyle = 'rgba(43, 24, 12, 0.72)';
  roundRect(ctx, 16, 14, 1248, 64, 12);
  ctx.fill();
  text(ctx, `SCORE ${Math.floor(world.score)}`, 40, 46, 26, PALETTE.text, FONT, 'left', 800);
  text(ctx, `DISTANCE ${Math.floor(world.distance)}m / ${ESCAPE_DISTANCE}m`, 330, 46, 22, PALETTE.hudBar, FONT, 'left', 700);
  text(ctx, `CORN ${world.cornCollected}`, 700, 46, 22, PALETTE.text, FONT, 'left', 700);
  // Lives as hearts.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < world.lives ? '#ef476f' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(880 + i * 34, 42, 9, 0, Math.PI * 2);
    ctx.arc(896 + i * 34, 42, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(872 + i * 34, 46);
    ctx.lineTo(904 + i * 34, 46);
    ctx.lineTo(888 + i * 34, 62);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, `BEST ${best}`, 1010, 46, 22, PALETTE.muted, FONT, 'left', 700);
  // Stage banner and progress bar.
  text(ctx, stage.name, 640, 100, 20, PALETTE.text, FONT, 'center', 800);
  const progress = Math.min(1, world.distance / ESCAPE_DISTANCE);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  roundRect(ctx, 340, 112, 600, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudBar;
  roundRect(ctx, 340, 112, 600 * progress, 10, 5);
  ctx.fill();
  // Stage tick marks on the bar.
  ctx.fillStyle = PALETTE.text;
  for (const mark of STAGES) {
    const x = 340 + 600 * (mark.start / ESCAPE_DISTANCE);
    ctx.fillRect(x - 1, 110, 2, 14);
  }
  if (world.turkey.hidden) {
    panel(ctx, 520, 150, 240, 44);
    text(ctx, 'HIDDEN IN THE HAY!', 640, 172, 20, PALETTE.safe, FONT, 'center', 800);
  }
  if (world.messageTimer > 0) {
    text(ctx, world.message, 640, 210, 22, '#fff3e0', FONT, 'center', 800);
  }
  if (world.flashTimer > 0) {
    ctx.fillStyle = 'rgba(239, 71, 111, 0.25)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
}

function drawControlsHint(ctx) {
  text(ctx, '← → run   SPACE jump   ↓ hide in hay   SHIFT sprint   P pause   M mute', 640, 692, 16, 'rgba(255,243,224,0.85)', FONT, 'center', 600);
}

export function drawWorld(ctx, world, farmer, time) {
  const staged = world.stage;
  drawBackground(ctx, staged.stage, world.distance, time, staged.index);
  for (const hay of world.haystacks) drawHaystack(ctx, hay.x, hay.y, hay.width, hay.height);
  for (const corn of world.corns) drawCorn(ctx, corn.x, corn.y, corn.size, corn.golden, corn.bob);
  for (const hazard of world.hazards) {
    if (hazard.kind === 'fence') drawFence(ctx, hazard.x, hazard.y + hazard.height);
    else if (hazard.kind === 'pumpkin') drawPumpkin(ctx, hazard.x + hazard.width / 2, hazard.y + hazard.height, hazard.width / 2);
    else if (hazard.kind === 'pin') drawRollingPin(ctx, hazard.x, hazard.y, hazard.width, hazard.height, time);
    else drawOven(ctx, hazard.x, hazard.y, hazard.width, hazard.height, hazard.flame, time);
  }
  for (const warning of world.warnings) {
    ctx.fillStyle = 'rgba(239, 71, 111, 0.85)';
    ctx.beginPath();
    ctx.moveTo(warning.x, 8);
    ctx.lineTo(warning.x + 26, 8);
    ctx.lineTo(warning.x + 13, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(239, 71, 111, 0.25)';
    ctx.fillRect(warning.x - 13, FIELD.groundY - 6, 52, 6);
  }
  for (const knife of world.knives) drawKnife(ctx, knife.x, knife.y, knife.width, knife.height);
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.colour;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  drawTurkey(ctx, world.turkey, time);
  drawFarmer(ctx, farmer, time);
}

export function drawTitle(ctx, world, farmer, best, time) {
  drawWorld(ctx, world, farmer, time);
  ctx.fillStyle = 'rgba(43, 24, 12, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 190, 96, 900, 420);
  text(ctx, "GOBBLE'S GREAT ESCAPE", 640, 160, 52, '#ffd166', DISPLAY_FONT, 'center', 900);
  text(ctx, 'Farmyard to Kitchen — 3 Stages, 5 Dangers, 1 Turkey', 640, 208, 24, PALETTE.text, FONT, 'center', 700);
  text(ctx, 'Thanksgiving is coming. The farmer wants you for dinner.', 640, 252, 20, PALETTE.muted, FONT, 'center', 600);
  text(ctx, 'Run 1,400m from the farmyard, through the barn, past the oven —', 640, 292, 19, PALETTE.text, FONT, 'center', 600);
  text(ctx, 'and out the kitchen back door. Dodge the knives. Hide in the hay.', 640, 320, 19, PALETTE.text, FONT, 'center', 600);
  text(ctx, 'HOW TO PLAY', 640, 366, 18, PALETTE.hudBar, FONT, 'center', 800);
  text(ctx, '← → or A / D run      SPACE jump      ↓ hide in haystacks', 640, 396, 18, PALETTE.text, FONT, 'center', 600);
  text(ctx, 'SHIFT sprint      Click the buttons or press ENTER to start', 640, 424, 18, PALETTE.text, FONT, 'center', 600);
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, 490, 448, 300, 52, 12);
  ctx.fill();
  text(ctx, '▶  START THE ESCAPE', 640, 474, 22, PALETTE.textDark, FONT, 'center', 800);
  text(ctx, `BEST SCORE: ${best}`, 640, 540, 18, PALETTE.muted, FONT, 'center', 700);
  text(ctx, 'Sound on for gobbles, alarms and the escape fanfare (M to mute)', 640, 576, 15, PALETTE.muted, FONT, 'center', 600);
}

export function drawCaught(ctx, world, farmer, best, time) {
  drawWorld(ctx, world, farmer, time);
  ctx.fillStyle = 'rgba(60, 10, 10, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 240, 130, 800, 380);
  text(ctx, 'CAUGHT!', 640, 196, 56, '#ef476f', DISPLAY_FONT, 'center', 900);
  text(ctx, 'The farmer grabs you by the drumstick…', 640, 248, 22, PALETTE.text, FONT, 'center', 600);
  text(ctx, '…and the oven is already warm. So close!', 640, 280, 20, PALETTE.muted, FONT, 'center', 600);
  text(ctx, `SCORE ${Math.floor(world.score)}    DISTANCE ${Math.floor(world.distance)}m    CORN ${world.cornCollected}`, 640, 336, 22, PALETTE.text, FONT, 'center', 700);
  text(ctx, `BEST ${best}`, 640, 372, 20, PALETTE.hudBar, FONT, 'center', 800);
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, 490, 408, 300, 52, 12);
  ctx.fill();
  text(ctx, '↻  RUN AGAIN  (R)', 640, 434, 22, PALETTE.textDark, FONT, 'center', 800);
}

export function drawEscaped(ctx, world, farmer, best, time) {
  drawWorld(ctx, world, farmer, time);
  ctx.fillStyle = 'rgba(20, 60, 20, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 240, 120, 800, 400);
  text(ctx, 'ESCAPED!', 640, 186, 56, '#7bc96f', DISPLAY_FONT, 'center', 900);
  text(ctx, 'You burst through the kitchen back door into the wild!', 640, 238, 22, PALETTE.text, FONT, 'center', 600);
  text(ctx, 'The farmer is still shouting. The oven stays empty tonight.', 640, 270, 20, PALETTE.muted, FONT, 'center', 600);
  text(ctx, `SCORE ${Math.floor(world.score)}    DISTANCE ${Math.floor(world.distance)}m    CORN ${world.cornCollected}`, 640, 326, 22, PALETTE.text, FONT, 'center', 700);
  text(ctx, `NEAR MISSES ${world.nearMisses}    BEST ${best}`, 640, 362, 20, PALETTE.hudBar, FONT, 'center', 800);
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, 490, 398, 300, 52, 12);
  ctx.fill();
  text(ctx, '↻  RUN AGAIN  (R)', 640, 424, 22, PALETTE.textDark, FONT, 'center', 800);
  text(ctx, 'Can you beat your best? The farmer remembers.', 640, 484, 16, PALETTE.muted, FONT, 'center', 600);
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43, 24, 12, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 390, 260, 500, 160);
  text(ctx, 'PAUSED', 640, 310, 40, '#ffd166', DISPLAY_FONT, 'center', 900);
  text(ctx, 'Press P or click to keep running', 640, 360, 20, PALETTE.text, FONT, 'center', 600);
}

export function drawGame(ctx, screen, world, farmer, best, time) {
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, world, farmer, best, time);
    return;
  }
  if (screen === SCREEN_CAUGHT) {
    drawCaught(ctx, world, farmer, best, time);
    return;
  }
  if (screen === SCREEN_ESCAPED) {
    drawEscaped(ctx, world, farmer, best, time);
    return;
  }
  drawWorld(ctx, world, farmer, time);
  if (screen === SCREEN_PLAY) {
    drawHud(ctx, world, best);
    drawControlsHint(ctx);
    return;
  }
  drawHud(ctx, world, best);
  drawPaused(ctx);
}
