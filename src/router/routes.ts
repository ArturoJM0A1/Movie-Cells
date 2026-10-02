import { RouteDefinition } from '@open-cells/core/types';

/**
 * Open Cells: routing table.
 *
 * `startApp({ routes })` receives this array and builds the `#!/…` router on top of it. Each entry
 * maps a URL pattern to a page *name* and to the lazy `action` that imports the page module.
 *
 * - The lazy import is the point of the whole table: a page Web Component (and everything it pulls
 *   in) is only downloaded/registered when the user actually navigates to it.
 * - `path: '/movie/:movieId'` declares a parameter that becomes a query parameter of the page. It is
 *   what allows deep links such as `#!/movie/1` to be shared or reloaded.
 * - `notFound: true` is the fallback the Cells router uses for any unmatched URL.
 */
export const routes: RouteDefinition[] = [
  {
    path: '/',
    name: 'home',
    component: 'home-page',
    action: async () => {
      await import('../pages/home/home-page.js');
    },
  },
  {
    path: '/search',
    name: 'search',
    component: 'search-page',
    action: async () => {
      await import('../pages/search/search-page.js');
    },
  },
  {
    path: '/movie/:movieId',
    name: 'movie',
    component: 'movie-page',
    action: async () => {
      await import('../pages/movie/movie-page.js');
    },
  },
  {
    path: '/not-found',
    name: 'not-found',
    notFound: true,
    component: 'not-found-page',
    action: async () => {
      await import('../pages/not-found/not-found-page.js');
    },
  },
];