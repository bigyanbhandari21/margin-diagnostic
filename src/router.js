/**
 * Router — Simple hash-based routing
 */

const routes = {};
let currentRoute = null;

/**
 * Register a route handler
 * @param {string} pattern - Route pattern (e.g., '/', '/diagnostic', '/synthesis', '/library', '/library/:id')
 * @param {Function} handler - Function to call when route matches. Receives params object.
 */
export function route(pattern, handler) {
  routes[pattern] = handler;
}

/**
 * Navigate to a hash route
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Match current hash against registered routes
 */
function matchRoute(hash) {
  const path = hash.replace(/^#/, '') || '/';

  // Try exact match first
  if (routes[path]) {
    return { handler: routes[path], params: {} };
  }

  // Try pattern matching (simple :param support)
  for (const pattern in routes) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let match = true;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { handler: routes[pattern], params };
    }
  }

  // Default to home
  if (routes['/']) {
    return { handler: routes['/'], params: {} };
  }

  return null;
}

/**
 * Handle route change
 */
function handleRouteChange() {
  const result = matchRoute(window.location.hash);
  if (result) {
    currentRoute = result;
    result.handler(result.params);
  }
}

/**
 * Initialize the router
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

/**
 * Get current route path
 */
export function getCurrentPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}
