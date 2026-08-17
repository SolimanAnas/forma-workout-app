// Builds two WebP sets in public/exercises/ from the source PNGs in img/exercises/:
//   <id>.webp        — small square icon (buttons/list). Prefers <base>-icon.png, else <base>.png.
//   <id>-poster.webp — large detailed poster (exercise detail page). Prefers <base>-detailed.png,
//                      else <base>.png, else <base>-icon.png.
// Run: node scripts/optimize-exercise-images.mjs   (or: npm run images)
import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'img/exercises';
const OUT = 'public/exercises';
const ICON_SIZE = 400;
const POSTER_MAX = 720;

// exercise id → source basename (without suffix/extension).
const BASES = {
  pushup: 'push-up',
  squat: 'squat',
  situp: 'sit-ups',
  crunch: 'crunches',
  'jumping-jack': 'jumping-jacks',
  plank: 'Plank',
  'leg-raises': 'leg-raises',
  'leg-flutters': 'leg-flutters',
  'russian-twist': 'russian-twist',
  'high-knees': 'high-knees',
  'mountain-climbers': 'mountain-climbers',
  burpee: 'burpees',
  'pull-up': 'pull-up',
};

// Icon source override: crunch uses the sit-up icon (no dedicated crunch icon).
const ICON_BASE_OVERRIDE = { crunch: 'sit-ups' };

const files = readdirSync(SRC);
const findFile = (name) => files.find((f) => f.toLowerCase() === name.toLowerCase());
const findFirst = (candidates) => {
  for (const c of candidates) {
    const hit = findFile(c);
    if (hit) return hit;
  }
  return null;
};

mkdirSync(OUT, { recursive: true });
let total = 0;
const log = (src, out) => {
  const kb = statSync(join(OUT, out)).size / 1024;
  total += kb;
  console.log(`  ${src.padEnd(28)} → ${out.padEnd(24)} ${kb.toFixed(1)} KB`);
};

for (const [id, base] of Object.entries(BASES)) {
  // ── Icon (square, cropped) ──
  const iconBase = ICON_BASE_OVERRIDE[id] ?? base;
  const iconSrc = findFirst([`${iconBase}-icon.png`, `${iconBase}.png`]);
  if (iconSrc) {
    await sharp(join(SRC, iconSrc))
      .resize(ICON_SIZE, ICON_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 78, effort: 6 })
      .toFile(join(OUT, `${id}.webp`));
    log(iconSrc, `${id}.webp`);
  } else {
    console.warn('  ! no icon source for', id);
  }

  // ── Poster (detailed, aspect preserved) ──
  const posterSrc = findFirst([`${base}-detailed.png`, `${base}.png`, `${base}-icon.png`]);
  if (posterSrc) {
    await sharp(join(SRC, posterSrc))
      .resize(POSTER_MAX, POSTER_MAX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 74, effort: 6 })
      .toFile(join(OUT, `${id}-poster.webp`));
    log(posterSrc, `${id}-poster.webp`);
  } else {
    console.warn('  ! no poster source for', id);
  }
}
console.log(`\nTotal: ${(total / 1024).toFixed(2)} MB`);
