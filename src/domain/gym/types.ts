/** Gym slot-based program data. PURE domain — no sensors. */

/** One selectable exercise for a slot, tagged with the muscle sub-region it emphasizes. */
export interface SlotOption {
  name: string;
  /** Sub-region, e.g. 'Upper Chest', 'Long Head', 'Lats' — drives smart (non-duplicate) suggestions. */
  region: string;
}

/** A slot the user fills with one exercise (e.g. "Main Chest Press"). */
export interface GymSlot {
  id: string;
  /** Muscle group heading the slot lives under, e.g. 'Chest'. */
  category: string;
  /** The slot's role, e.g. 'Main Press', 'Side Delts'. */
  target: string;
  sets: string;
  reps: string;
  /** Suggested exercises to choose from. */
  options: SlotOption[];
  /** Name of the default/recommended option (falls back to options[0]). */
  recommendedOption?: string;
}

export interface GymDay {
  id: string;
  name: string;
  focus: string;
  slots: GymSlot[];
}

export interface GymSplit {
  id: string;
  short: string;
  name: string;
  description: string;
  level: string;
  days: GymDay[];
}
