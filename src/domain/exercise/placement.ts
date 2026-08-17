/** Phone-placement guidance shown before a sensor-based exercise (spec §13). PURE domain data. */

export interface PlacementConfig {
  id: string;
  title: string;
  steps: string[];
  recommendedDistance?: string;
}

export const PLACEMENTS: Record<string, PlacementConfig> = {
  'floor-in-front': {
    id: 'floor-in-front',
    title: 'Place the phone on the floor',
    steps: ['Put the phone flat on the floor in front of your head.', 'Screen facing up.'],
    recommendedDistance: '10–30 cm',
  },
  'upper-arm': {
    id: 'upper-arm',
    title: 'Strap the phone to your upper arm',
    steps: [
      'Use an armband on your upper arm (or a snug sleeve pocket).',
      'This lets the phone move with each rep so it can count automatically.',
      'On the floor the phone can’t detect push-ups — use the armband, or tap to count.',
    ],
  },
  'pocket-or-thigh': {
    id: 'pocket-or-thigh',
    title: 'Secure the phone at your thigh',
    steps: ['Place the phone in a front pocket or strap it to your thigh.', 'Screen against your leg.'],
  },
  'chest-strap-or-hold': {
    id: 'chest-strap-or-hold',
    title: 'Hold the phone to your chest',
    steps: ['Hold the phone flat against your upper chest.', 'Or use a chest strap.'],
  },
  'pocket-or-armband': {
    id: 'pocket-or-armband',
    title: 'Secure the phone to your arm',
    steps: ['Use an armband, or place the phone in a snug pocket.'],
  },
  'on-back-or-hold': {
    id: 'on-back-or-hold',
    title: 'Place the phone on your lower back',
    steps: ['Rest the phone flat on your lower back.', 'Screen facing up.'],
  },
};

export function getPlacement(placementId: string): PlacementConfig | undefined {
  return PLACEMENTS[placementId];
}
