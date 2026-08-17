/** Short "how to do it" cues per exercise (spec §13). PURE domain data. */

export const HOWTO: Record<string, string[]> = {
  pushup: [
    'Hands slightly wider than your shoulders, body in a straight line.',
    'Lower your chest until your elbows are ~90°.',
    'Push back up to full arm extension — that’s one rep.',
  ],
  squat: [
    'Feet shoulder-width apart, chest up, core braced.',
    'Sit back and down until your thighs are about parallel.',
    'Drive through your heels back to standing.',
  ],
  situp: [
    'Lie back, knees bent, feet flat on the floor.',
    'Curl your torso all the way up toward your knees.',
    'Lower under control back to the floor.',
  ],
  crunch: [
    'Lie back with knees bent, hands by your head.',
    'Lift your shoulder blades off the floor, squeezing your abs.',
    'Lower slowly — keep the movement small and controlled.',
  ],
  'jumping-jack': [
    'Start with feet together, arms at your sides.',
    'Jump feet wide while raising your arms overhead.',
    'Jump back to the start — keep a steady rhythm.',
  ],
  plank: [
    'Forearms under your shoulders, body in a straight line.',
    'Brace your core and glutes — don’t let your hips sag.',
    'Hold and breathe steadily for the target time.',
  ],
  'leg-raises': [
    'Lie flat, legs straight, hands under your lower back.',
    'Raise both legs up toward vertical, keeping them straight.',
    'Lower slowly without letting your heels touch the floor.',
  ],
  'leg-flutters': [
    'Lie flat, legs straight and lifted a few inches off the floor.',
    'Alternately flutter your legs up and down in small, quick kicks.',
    'Keep your core tight and lower back pressed down.',
  ],
  'russian-twist': [
    'Sit with knees bent, lean back slightly, feet lifted if you can.',
    'Rotate your torso to tap the floor on one side.',
    'Twist to the other side — one tap each side is a rep.',
  ],
  'high-knees': [
    'Stand tall, run in place driving your knees up to hip height.',
    'Stay on the balls of your feet with a quick cadence.',
    'Pump your arms in time with your legs.',
  ],
  'mountain-climbers': [
    'Start in a high plank, hands under your shoulders.',
    'Drive one knee toward your chest, then switch quickly.',
    'Keep your hips low and your core braced throughout.',
  ],
  burpee: [
    'From standing, drop to a squat and kick your feet back to a plank.',
    'Do a push-up (optional), then jump your feet back in.',
    'Explode up into a jump — that’s one rep.',
  ],
  'pull-up': [
    'Hang from the bar with an overhand grip, arms fully extended.',
    'Pull your chest toward the bar, driving your elbows down.',
    'Lower under control to a full hang.',
  ],
  'jump-squat': [
    'Drop into a squat, chest up and core braced.',
    'Explode straight up into a jump, extending fully.',
    'Land softly back into a squat and repeat.',
  ],
  'calf-raises': [
    'Stand tall with feet hip-width apart.',
    'Push through the balls of your feet to lift your heels high.',
    'Lower slowly under control — feel the stretch.',
  ],
  'side-plank': [
    'Lie on your side, propped on one forearm under your shoulder.',
    'Lift your hips so your body is a straight line.',
    'Hold and breathe steadily — switch sides halfway.',
  ],
  'standing-knee-raises': [
    'Stand tall, core engaged.',
    'Drive one knee up toward hip height, then lower.',
    'Alternate legs with a steady rhythm.',
  ],
  'jump-rope': [
    'Jump with both feet, staying on the balls of your feet.',
    'Turn the rope (or mime it) with small wrist circles.',
    'Keep quick, light bounces and a steady cadence.',
  ],
};

export function getHowto(exerciseId: string): string[] {
  return HOWTO[exerciseId] ?? [];
}
