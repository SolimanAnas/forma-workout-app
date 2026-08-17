import { getAllSettings, setSetting, type ThemePref, type Units } from '../../data/settings';
import { setState } from '../../app/state';
import { applyTheme } from '../theme';
import { el, screen } from '../dom';

const APP_VERSION = '1.0.0';

export async function renderProfile(outlet: HTMLElement): Promise<void> {
  const settings = await getAllSettings();
  const view = screen('Settings', 'Preferences & about.');

  // ── Appearance ──
  const themeSelect = select(['system', 'light', 'dark'] as ThemePref[], settings.theme, (v) => {
    applyTheme(v);
    void setSetting('theme', v);
  });
  const unitsSelect = select(['metric', 'imperial'] as Units[], settings.units, (v) =>
    void setSetting('units', v),
  );
  view.append(
    sectionCard('🎨 Appearance', [field('Theme', themeSelect), field('Units', unitsSelect)]),
  );

  // ── Rep counting ──
  view.append(
    sectionCard('🔢 Rep counting', [
      toggleField('Tap to count reps', settings.tapToCount, (v) => void setSetting('tapToCount', v)),
      toggleField('Sensor counting', settings.sensorCounting, (v) =>
        void setSetting('sensorCounting', v),
      ),
    ]),
  );

  // ── Coaching ──
  view.append(
    sectionCard('🔊 Coaching', [
      toggleField('Voice coach', settings.voiceCoach, (v) => void setSetting('voiceCoach', v)),
    ]),
  );

  // ── Developer ──
  const diagLink = el('a', { class: 'btn', href: '#/sensor-diag' }, ['Sensor diagnostics']);
  diagLink.hidden = !settings.devMode;
  view.append(
    sectionCard('🛠 Developer', [
      toggleField('Developer mode', settings.devMode, (v) => {
        void setSetting('devMode', v);
        setState({ devMode: v });
        diagLink.hidden = !v;
      }),
      diagLink,
    ]),
  );

  // ── About ──
  view.append(aboutCard());

  view.append(
    el('p', { class: 'disclaimer', role: 'note' }, [
      'Forma is a training tool, not a medical device. Stop exercising if you experience ' +
        'significant pain, dizziness, chest pain, or unusual shortness of breath.',
    ]),
  );

  outlet.append(view);
}

function aboutCard(): HTMLElement {
  return el('div', { class: 'card about' }, [
    el('div', { class: 'eyebrow' }, ['About']),

    // App identity.
    el('div', { class: 'about__app' }, [
      el('img', { class: 'about__logo', src: '/forma-workout-app/icons/icon-192x192.png', alt: 'Forma icon' }),
      el('div', {}, [
        el('div', { class: 'about__app-name' }, ['Forma']),
        el('div', { class: 'exercise-item__meta' }, [
          `v${APP_VERSION} · Sensor-powered fitness PWA`,
        ]),
      ]),
    ]),

    // Developer.
    el('div', { class: 'about__dev' }, [
      el('img', { class: 'about__avatar profile-img', src: 'https://raw.githubusercontent.com/SolimanAnas/CPG-2025/main/images/image-01.png', alt: 'Soliman Anas Soliman' }),
      el('div', { class: 'about__dev-body' }, [
        el('div', { class: 'about__dev-name' }, ['Soliman Anas']),
        el('div', { class: 'about__dev-role' }, ['EMT, RN, MSN, MBA · Graphic Designer & Web Developer']),
        el('div', { class: 'about__dev-links' }, [
          extLink('GitHub', 'https://github.com/solimananas'),
          extLink('Live app', 'https://solimananas.github.io/forma-workout-app/'),
        ]),
      ]),
    ]),

    el('div', { class: 'about__credit' }, ['Created & maintained by Soliman Anas.']),
  ]);
}

function extLink(label: string, href: string): HTMLElement {
  return el('a', { class: 'about__link', href, target: '_blank', rel: 'noopener noreferrer' }, [label]);
}

function sectionCard(title: string, rows: HTMLElement[]): HTMLElement {
  return el('div', { class: 'card' }, [el('div', { class: 'eyebrow' }, [title]), ...rows]);
}

function select<T extends string>(options: T[], current: T, onChange: (v: T) => void): HTMLSelectElement {
  const sel = el('select') as HTMLSelectElement;
  for (const opt of options) {
    const o = el('option', { value: opt }, [opt[0].toUpperCase() + opt.slice(1)]);
    if (opt === current) o.selected = true;
    sel.append(o);
  }
  sel.addEventListener('change', () => onChange(sel.value as T));
  return sel;
}

function field(label: string, control: HTMLElement): HTMLElement {
  const id = `f-${label.toLowerCase().replace(/\s+/g, '-')}`;
  control.id = id;
  control.setAttribute('aria-label', label);
  return el('div', { class: 'field' }, [el('label', { for: id }, [label]), control]);
}

function toggleField(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox', class: 'toggle' }) as HTMLInputElement;
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return field(label, input);
}
