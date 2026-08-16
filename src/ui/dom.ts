/** Minimal DOM helpers to keep screens declarative without a framework. */

type Attrs = Record<string, string | boolean | number | EventListener>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'function') {
      node.addEventListener(key, value as EventListener);
    } else if (typeof value === 'boolean') {
      if (value) node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Standard screen wrapper: a titled <section>. */
export function screen(title: string, lead?: string): HTMLElement {
  const section = el('section', { class: 'screen', 'aria-label': title });
  section.append(el('h1', { class: 'screen__title' }, [title]));
  if (lead) section.append(el('p', { class: 'screen__lead' }, [lead]));
  return section;
}
