// Gobble's Great Escape — the hand-in program (Node 22, standard library only).
//
// It hands the game in: it copies this repository's game/ and screenshots/ into the
// output directory and writes /output/dossier.json, the summary the judge reads, with
// the vendored make.fun library. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program runs twice in the grader and both runs must write the same bytes, so it
// does nothing time- or environment-dependent: it only copies files and builds the
// dossier from them.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function requireDirectory(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Gobble's Great Escape: missing ${label} directory at ${path}`);
  }
}

function copyDirectory(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function listNames(path) {
  return readdirSync(path).sort();
}

function checkScreenshots(path) {
  const names = listNames(path);
  if (names.length < 3 || names.length > 4) {
    throw new Error(`Gobble's Great Escape: expected 3 or 4 screenshots, found ${names.length}`);
  }
  return names;
}

requireDirectory(join(repoRoot, 'game'), 'game');
requireDirectory(join(repoRoot, 'screenshots'), 'screenshots');
checkScreenshots(join(repoRoot, 'screenshots'));

mkdirSync(outputDir, { recursive: true });
copyDirectory(join(repoRoot, 'game'), join(outputDir, 'game'));
copyDirectory(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the
// others refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files, in all, or a path under
// game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
