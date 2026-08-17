// Converts the large source mascot PNGs in img/exercises/ into small square WebP files in
// public/exercises/, named by exercise id. Prefers the clean `<name>-icon.png` variant when it
// exists, otherwise falls back to `<name>.png`. Run: node scripts/optimize-exercise-images.mjs
import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'img/exercises';
const OUT = 'public/exercises';
const SIZE = 400;

// exercise id → source basename (without extension). The `-icon` variant is preferred if present.
const SOURCES = {
  pushup: 'push-up',
  squat: 'squat',
  situp: 'sit-ups',
  'jumping-jack': 'jumping-jacks',
  plank: 'Plank',
  crunch: 'crunches',
  'leg-raises': 'leg-raises',
  'leg-flutters': 'leg-flutters',
  'russian-twist': 'russian-twist',
  'high-knees': 'high-knees',
  'mountain-climbers': 'mountain-climbers',
  burpee: 'burpees',
  'pull-up': 'pull-up',
};

// Case-insensitive lookup of an existing source file.
const files = readdirSync(SRC);
function findSource(base) {
  for (const candidate of [`${base}-icon.png`, `${base}.png`]) {
    const hit = files.find((f) => f.toLowerCase() === candidate.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [id, base] of Object.entries(SOURCES)) {
  const src = findSource(base);
  if (!src) {
    console.warn('  ! no source for', id);
    continue;
  }
  const out = join(OUT, `${id}.webp`);
  await sharp(join(SRC, src))
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: 76, effort: 6 })
    .toFile(out);
  const kb = statSync(out).size / 1024;
  total += kb;
  console.log(`  ${src.padEnd(28)} → ${id}.webp  ${kb.toFixed(1)} KB`);
}
console.log(`\nTotal: ${(total / 1024).toFixed(2)} MB across ${Object.keys(SOURCES).length} images`);
