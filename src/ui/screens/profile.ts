import { getAllSettings, setSetting, type ThemePref, type Units } from '../../data/settings';
import { setState } from '../../app/state';
import { applyTheme } from '../theme';
import { el, screen } from '../dom';

export async function renderProfile(outlet: HTMLElement): Promise<void> {
  const settings = await getAllSettings();
  const view = screen('Profile', 'Settings and preferences.');
  const card = el('div', { class: 'card' });

  // Theme
  const themeSelect = el('select', { 'aria-label': 'Theme' }) as HTMLSelectElement;
  for (const opt of ['system', 'light', 'dark'] as ThemePref[]) {
    const o = el('option', { value: opt }, [opt[0].toUpperCase() + opt.slice(1)]);
    if (opt === settings.theme) o.selected = true;
    themeSelect.append(o);
  }
  themeSelect.addEventListener('change', () => {
    const pref = themeSelect.value as ThemePref;
    applyTheme(pref);
    void setSetting('theme', pref);
  });
  card.append(field('Theme', themeSelect));

  // Units
  const unitsSelect = el('select', { 'aria-label': 'Units' }) as HTMLSelectElement;
  for (const opt of ['metric', 'imperial'] as Units[]) {
    const o = el('option', { value: opt }, [opt[0].toUpperCase() + opt.slice(1)]);
    if (opt === settings.units) o.selected = true;
    unitsSelect.append(o);
  }
  unitsSelect.addEventListener('change', () => void setSetting('units', unitsSelect.value as Units));
  card.append(field('Units', unitsSelect));

  // Rep-counting input methods (both on by default).
  card.append(
    toggleField('Tap to count reps', settings.tapToCount, (v) => void setSetting('tapToCount', v)),
  );
  card.append(
    toggleField('Sensor counting', settings.sensorCounting, (v) =>
      void setSetting('sensorCounting', v),
    ),
  );

  // Voice coach
  card.append(
    toggleField('Voice coach', settings.voiceCoach, (v) => void setSetting('voiceCoach', v)),
  );

  // Dev mode — reveals sensor diagnostics
  const devRow = toggleField('Developer mode', settings.devMode, (v) => {
    void setSetting('devMode', v);
    setState({ devMode: v });
    diagLink.hidden = !v;
  });
  card.append(devRow);

  const diagLink = el('a', { class: 'btn', href: '#/sensor-diag' }, ['Sensor diagnostics']);
  diagLink.hidden = !settings.devMode;

  view.append(card, diagLink);

  view.append(
    el('p', { class: 'disclaimer', role: 'note' }, [
      'Forma is a training tool, not a medical device. Stop exercising if you experience ' +
        'significant pain, dizziness, chest pain, or unusual shortness of breath.',
    ]),
  );

  outlet.append(view);
}

function field(label: string, control: HTMLElement): HTMLElement {
  const id = `f-${label.toLowerCase().replace(/\s+/g, '-')}`;
  control.id = id;
  return el('div', { class: 'field' }, [el('label', { for: id }, [label]), control]);
}

function toggleField(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox', class: 'toggle' }) as HTMLInputElement;
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return field(label, input);
}
