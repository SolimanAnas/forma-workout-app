/** Sparse coaching phrases (spec §24). PURE domain — just strings, kept minimal by design. */
export const COACH = {
  getReady: (): string => 'Get ready',
  start: (): string => 'Start',
  goodRep: (): string => 'Good rep',
  halfway: (): string => 'Halfway',
  repsLeft: (n: number): string => (n === 1 ? 'One more' : `${n} more`),
  setComplete: (): string => 'Set complete',
  rest: (): string => 'Rest',
  go: (): string => 'Go',
  nextExercise: (name: string): string => `Next: ${name}`,
  finished: (): string => 'Workout complete',
} as const;
