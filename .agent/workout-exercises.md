# Gym Exercises — AI Photo Generation List

## Exercises (18 total)

Generate a **poster image** (detailed, full-body, instructional style) and an **icon image** (small, clean, square) for each exercise.

| # | Exercise | ID | Category | Muscle Groups |
|---|----------|-----|----------|---------------|
| 1 | Squat | `squat` | strength | quads, glutes, hamstrings |
| 2 | Jump Squat | `jump-squat` | strength | quads, glutes, hamstrings |
| 3 | Calf Raises | `calf-raises` | strength | calves |
| 4 | Push-up | `pushup` | strength | chest, triceps, shoulders, core |
| 5 | Pull-up | `pull-up` | strength | back, biceps, forearms |
| 6 | Plank | `plank` | core | core, shoulders |
| 7 | Side Plank | `side-plank` | core | obliques, core |
| 8 | Sit-up | `situp` | core | abs, hip flexors |
| 9 | Crunch | `crunch` | core | abs |
| 10 | Leg Raises | `leg-raises` | core | lower abs, hip flexors |
| 11 | Leg Flutters | `leg-flutters` | core | lower abs, hip flexors |
| 12 | Russian Twist | `russian-twist` | core | obliques, core |
| 13 | Jumping Jack | `jumping-jack` | cardio | full body |
| 14 | High Knees | `high-knees` | cardio | legs, cardio |
| 15 | Standing Knee Raises | `standing-knee-raises` | core | abs, hip flexors |
| 16 | Mountain Climbers | `mountain-climbers` | cardio | core, shoulders, legs |
| 17 | Jump Rope | `jump-rope` | cardio | calves, shoulders |
| 18 | Burpee | `burpee` | cardio | full body |

## Image Specs

### Poster (detailed)
- Filename: `{id}-poster.webp`
- Style: Clean, instructional, full-body pose showing proper form
- Background: Light/neutral
- Output: WebP format

### Icon (small)
- Filename: `{id}.webp`
- Style: Simplified, recognizable silhouette or icon
- Background: Transparent or solid color
- Output: WebP format

## Output Folder
`public/exercises/`

## Naming Convention
- Icon: `{exercise-id}.webp` (e.g., `squat.webp`, `pushup.webp`)
- Poster: `{exercise-id}-poster.webp` (e.g., `squat-poster.webp`, `pushup-poster.webp`)
