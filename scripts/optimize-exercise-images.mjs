// Converts the large source mascot PNGs in img/exercises/ into small square WebP files
// in public/exercises/, named by exercise id. Run: node scripts/optimize-exercise-images.mjs
import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const SRC = 'img/exercises';
const OUT = 'public/exercises';
const SIZE = 320;

// Source filename (without extension, lowercased) → exercise id.
const MAP = {
  'push-up': 'pushup',
  squat: 'squat',
  'sit-ups': 'situp',
  'jumping-jacks': 'jumping-jack',
  plank: 'plank',
  crunches: 'crunch',
  burpees: 'burpee',
  'high-knees': 'high-knees',
  'leg-raises': 'leg-raises',
  'mountain-climbers': 'mountain-climbers',
  'pull-up': 'pull-up',
  'russian-twist': 'russian-twist',
};

mkdirSync(OUT, { recursive: true });

let total = 0;
for (const file of readdirSync(SRC)) {
  if (extname(file).toLowerCase() !== '.png') continue;
  const key = basename(file, extname(file)).toLowerCase();
  const id = MAP[key];
  if (!id) {
    console.warn('  ! no id mapping for', file);
    continue;
  }
  const out = join(OUT, `${id}.webp`);
  await sharp(join(SRC, file))
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78, effort: 6 })
    .toFile(out);
  const kb = statSync(out).size / 1024;
  total += kb;
  console.log(`  ${file.padEnd(24)} → ${id}.webp  ${kb.toFixed(1)} KB`);
}
console.log(`\nTotal: ${(total / 1024).toFixed(2)} MB across all exercise images`);
