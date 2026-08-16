/** Minimal global UI state with pub/sub. Not for persisted data (that lives in `data/`). */

export interface AppState {
  /** When true, an exercise/workout is in progress and chrome (nav) is hidden. */
  activeWorkout: boolean;
  devMode: boolean;
}

type Listener = (state: Readonly<AppState>) => void;

const state: AppState = {
  activeWorkout: false,
  devMode: false,
};

const listeners = new Set<Listener>();

export function getState(): Readonly<AppState> {
  return state;
}

export function setState(patch: Partial<AppState>): void {
  Object.assign(state, patch);
  for (const fn of listeners) fn(state);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
