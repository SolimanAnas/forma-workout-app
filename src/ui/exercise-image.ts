import { EXERCISE_ICONS } from './exercise-icons';

/** Path to an exercise's mascot image (served from public/exercises at the app base path). */
export function exerciseImage(id: string): string {
  return `${import.meta.env.BASE_URL}exercises/${id}.webp`;
}

/** Emoji fallback if an image fails to load. */
export function exerciseEmoji(id: string): string {
  return EXERCISE_ICONS[id] ?? '🏋️';
}
