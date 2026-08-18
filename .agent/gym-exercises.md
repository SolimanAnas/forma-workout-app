# Gym Split Exercises — AI Photo Generation List

Extracted from `src/domain/gym/splits.ts`. These are gym/machine exercises used in workout splits.

## Exercises (62 unique)

### Chest (12)
| # | Exercise | Region |
|---|----------|--------|
| 1 | Bench Press | Mid Chest |
| 2 | Incline Bench Press | Upper Chest |
| 3 | Dumbbell Bench Press | Mid Chest |
| 4 | Machine Chest Press | General Chest |
| 5 | Incline Dumbbell Press | Upper Chest |
| 6 | Incline Machine Press | Upper Chest |
| 7 | Pec Deck | General Chest |
| 8 | Cable Fly | General Chest |
| 9 | Dumbbell Fly | General Chest |
| 10 | Chest Dips | Lower Chest |
| 11 | Decline Bench Press | Lower Chest |
| 12 | Low-to-High Cable Fly | Upper Chest |
| 13 | High-to-Low Cable Fly | Lower Chest |

### Shoulders (6)
| # | Exercise | Region |
|---|----------|--------|
| 14 | Overhead Press | Front Delts |
| 15 | Dumbbell Shoulder Press | Front Delts |
| 16 | Machine Shoulder Press | Front Delts |
| 17 | Dumbbell Lateral Raise | Side Delts |
| 18 | Cable Lateral Raise | Side Delts |
| 19 | Machine Lateral Raise | Side Delts |

### Rear Delts (3)
| # | Exercise | Region |
|---|----------|--------|
| 20 | Face Pull | Rear Delts |
| 21 | Reverse Pec Deck | Rear Delts |
| 22 | Rear Delt Fly | Rear Delts |

### Triceps (6)
| # | Exercise | Region |
|---|----------|--------|
| 23 | Cable Overhead Extension | Long Head |
| 24 | Dumbbell Overhead Extension | Long Head |
| 25 | Skull Crushers | Long Head |
| 26 | Rope Pushdown | Lateral Head |
| 27 | V-Bar Pushdown | Lateral Head |
| 28 | Straight-Bar Pushdown | Lateral Head |

### Back (10)
| # | Exercise | Region |
|---|----------|--------|
| 29 | Pull-up | Lats |
| 30 | Lat Pulldown | Lats |
| 31 | Chin-up | Lats |
| 32 | Neutral-Grip Pulldown | Lats |
| 33 | Barbell Row | Mid Back |
| 34 | Seated Cable Row | Mid Back |
| 35 | Chest-Supported Row | Mid Back |
| 36 | T-Bar Row | Mid Back |
| 37 | Deadlift | Posterior Chain |
| 38 | Trap-Bar Deadlift | Posterior Chain |
| 39 | Rack Pull | Upper Back |

### Biceps (7)
| # | Exercise | Region |
|---|----------|--------|
| 40 | Barbell Curl | Biceps |
| 41 | EZ-Bar Curl | Biceps |
| 42 | Dumbbell Curl | Biceps |
| 43 | Cable Curl | Biceps |
| 44 | Hammer Curl | Brachialis |
| 45 | Rope Hammer Curl | Brachialis |
| 46 | Incline Curl | Biceps Long Head |

### Quads (6)
| # | Exercise | Region |
|---|----------|--------|
| 47 | Back Squat | Quads |
| 48 | Front Squat | Quads |
| 49 | Hack Squat | Quads |
| 50 | Leg Press | Quads |
| 51 | Leg Extension | Quads |
| 52 | Sissy Squat | Quads |

### Hamstrings (5)
| # | Exercise | Region |
|---|----------|--------|
| 53 | Romanian Deadlift | Hamstrings |
| 54 | Stiff-Leg Deadlift | Hamstrings |
| 55 | Good Morning | Hamstrings |
| 56 | Lying Leg Curl | Hamstrings |
| 57 | Seated Leg Curl | Hamstrings |

### Glutes (3)
| # | Exercise | Region |
|---|----------|--------|
| 58 | Hip Thrust | Glutes |
| 59 | Bulgarian Split Squat | Glutes |
| 60 | Walking Lunge | Glutes |

### Calves (3)
| # | Exercise | Region |
|---|----------|--------|
| 61 | Standing Calf Raise | Calves |
| 62 | Seated Calf Raise | Calves |
| 63 | Leg-Press Calf Raise | Calves |

### Core/Abs (3)
| # | Exercise | Region |
|---|----------|--------|
| 64 | Hanging Leg Raise | Abs |
| 65 | Cable Crunch | Abs |
| 66 | Plank | Core |

## Image Specs

### Poster (detailed)
- Style: Clean, instructional, full-body pose showing proper form
- Background: Light/neutral
- Output: WebP format

### Icon (small)
- Style: Simplified, recognizable silhouette or icon
- Background: Transparent or solid color
- Output: WebP format

## Output Folder
`public/gym/`

## Naming Convention
- Icon: `{exercise-id}.webp` (e.g., `bench-press.webp`, `lat-pulldown.webp`)
- Poster: `{exercise-id}-poster.webp` (e.g., `bench-press-poster.webp`)
