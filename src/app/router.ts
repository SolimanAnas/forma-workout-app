/** Tiny hash-based router — simplest option for GitHub Pages subpath hosting (spec §19). */

export interface Route {
  path: string;
  title: string;
  /** `param` is the remainder of the hash after the route's first segment (e.g. `exercise/pushup`). */
  render: (outlet: HTMLElement, param?: string) => void | Promise<void>;
}

export const ROUTE_CHANGED = 'route:changed';

export class Router {
  private readonly routes = new Map<string, Route>();

  constructor(
    private readonly outlet: HTMLElement,
    private readonly fallback = 'home',
  ) {}

  add(route: Route): this {
    this.routes.set(route.path, route);
    return this;
  }

  start(): void {
    window.addEventListener('hashchange', () => void this.resolve());
    void this.resolve();
  }

  navigate(path: string): void {
    if (this.currentPath() === path) {
      void this.resolve();
    } else {
      window.location.hash = `#/${path}`;
    }
  }

  currentPath(): string {
    const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    return raw || this.fallback;
  }

  private async resolve(): Promise<void> {
    const path = this.currentPath();
    let route = this.routes.get(path);
    let param: string | undefined;
    if (!route) {
      // Try matching by first segment, passing the rest as a param (e.g. `exercise/pushup`).
      const slash = path.indexOf('/');
      if (slash > 0) {
        route = this.routes.get(path.slice(0, slash));
        param = path.slice(slash + 1) || undefined;
      }
    }
    route = route ?? this.routes.get(this.fallback);
    if (!route) return;
    this.outlet.replaceChildren();
    await route.render(this.outlet, param);
    document.title = `Forma — ${route.title}`;
    window.dispatchEvent(new CustomEvent(ROUTE_CHANGED, { detail: { path: route.path } }));
  }
}
