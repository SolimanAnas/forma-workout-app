import { EXERCISE_ICONS } from './exercise-icons';

/** Small square icon (buttons, lists). */
export function exerciseImage(id: string): string {
  return `${import.meta.env.BASE_URL}exercises/${id}.webp`;
}

/** Large detailed poster (exercise detail page). */
export function exercisePoster(id: string): string {
  return `${import.meta.env.BASE_URL}exercises/${id}-poster.webp`;
}

/** Emoji fallback if an image fails to load. */
export function exerciseEmoji(id: string): string {
  return EXERCISE_ICONS[id] ?? '🏋️';
}
