// ============================================
// Simple Hash Router
// ============================================

export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const handler = this.routes[hash];
    if (handler) {
      this.currentRoute = hash;
      handler();
    } else if (this.routes['/']) {
      this.currentRoute = '/';
      this.routes['/']();
    }
  }

  start() {
    this.handleRoute();
  }
}
