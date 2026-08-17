import '../ui/styles/reset.css';
import '../ui/styles/tokens.css';
import '../ui/styles/app.css';

import { Router } from './router';
import { mountShell } from './shell';
import { setState } from './state';
import { setupPWA } from './pwa';
import { applyTheme } from '../ui/theme';
import { getAllSettings } from '../data/settings';
import { renderHome } from '../ui/screens/home';
import { renderWorkout } from '../ui/screens/workout';
import { renderExercises } from '../ui/screens/exercises';
import { renderProgress } from '../ui/screens/progress';
import { renderProfile } from '../ui/screens/profile';
import { renderSensorDiag } from '../ui/screens/sensor-diag';
import { renderActiveWorkout } from '../ui/screens/active-workout';
import { renderExercise } from '../ui/screens/exercise';

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) throw new Error('Missing #app root element');

  // Apply persisted preferences before first paint where possible.
  const settings = await getAllSettings();
  applyTheme(settings.theme);
  setState({ devMode: settings.devMode });

  const outlet = mountShell(root);

  const router = new Router(outlet, 'home')
    .add({ path: 'home', title: 'Today', render: renderHome })
    .add({ path: 'workout', title: 'Workout', render: renderWorkout })
    .add({ path: 'exercise', title: 'Exercise', render: renderExercise })
    .add({ path: 'exercises', title: 'Exercises', render: renderExercises })
    .add({ path: 'progress', title: 'Progress', render: renderProgress })
    .add({ path: 'settings', title: 'Settings', render: renderProfile })
    .add({ path: 'active-workout', title: 'Active workout', render: renderActiveWorkout })
    .add({ path: 'sensor-diag', title: 'Sensor diagnostics', render: renderSensorDiag });

  router.start();
  setupPWA();
}

void bootstrap();
