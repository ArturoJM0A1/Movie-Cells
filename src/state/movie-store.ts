/**
 * Open Cells "store": the actions that mutate the shared state.
 *
 * Open Cells exposes `publish` / `subscribe` / `navigate` as plain functions exported from
 * `@open-cells/core` (they are not methods of a component), which is what allows this module to
 * write to the application channels without owning any Web Component. Components stay declarative:
 * they subscribe to the channels they care about and call the actions below on user interaction.
 *
 * Every action follows the same contract:
 *   1. publish `loading = true` and clear `error`
 *   2. call the service layer (`src/services/movie-service.ts`)
 *   3. publish the result, or a human readable message when it fails
 *   4. publish `loading = false`
 *
 * Steps 3 and 4 are only run by the request that still owns its domain (see `startRequest`), so a
 * response that has been superseded can neither write results nor steal the `loading` flag.
 */
import { publish } from '@open-cells/core';
import { CHANNELS } from './app-state.js';
import { ApiError } from '../services/api-client.js';
import {
  getMovieById,
  getPageSize,
  getPopularMovies,
  searchMovies,
} from '../services/movie-service.js';
import { clampPage, getPageSlice, getTotalPages } from '../utils/pagination.js';
import { applyTheme, oppositeTheme, persistTheme } from '../utils/theme.js';

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.isNotFound) {
      return 'No encontramos esa película en el catálogo.';
    }
    if (error.isNetworkError) {
      return 'No hay conexión con la API de películas. Revisa tu red e inténtalo de nuevo.';
    }
    return error.message;
  }
  return fallback;
}

/**
 * In-flight request controllers, one per domain.
 * They let a new search/detail request cancel the previous one, so a slow response can never
 * overwrite a newer result.
 */
const controllers = {
  search: null as AbortController | null,
  popular: null as AbortController | null,
  movie: null as AbortController | null,
};

/**
 * Cancels the request in flight for `domain` and returns a handle to the new one.
 *
 * Aborting alone is not enough: the `fetch` of the cancelled request rejects asynchronously, so its
 * `catch`/`finally` still run and could turn off the `loading` flag of the request that replaced it.
 * `isCurrent()` identifies the request that currently owns the domain, so a superseded one stays
 * completely silent.
 */
function startRequest(domain: keyof typeof controllers): {
  signal: AbortSignal;
  isCurrent: () => boolean;
} {
  controllers[domain]?.abort();
  const controller = new AbortController();
  controllers[domain] = controller;

  return {
    signal: controller.signal,
    isCurrent: () => controllers[domain] === controller,
  };
}

/**
 * Amount of results currently loaded for the search domain.
 * Open Cells channels can only be read through a subscription, so the store keeps this mirror to be
 * able to validate a page number without asking any component to cooperate.
 */
let searchResultCount = 0;

/* -------------------------------------------------------------------------------------------- */
/* Search                                                                                       */
/* -------------------------------------------------------------------------------------------- */

/** Stores the term without triggering a request (used while typing). */
export function setSearchTerm(term: string): void {
  publish(CHANNELS.searchTerm, term);
}

/** Moves the results pager. Clamped against the amount of results already loaded. */
export function setCurrentPage(page: number): void {
  publish(CHANNELS.currentPage, clampPage(page, getTotalPages(searchResultCount, getPageSize())));
}

/** Clears term, results and paging. Used when the results page is opened without a term. */
export function resetSearch(): void {
  // A search cancelled here would otherwise land after the reset and repopulate the page.
  controllers.search?.abort();
  searchResultCount = 0;

  publish(CHANNELS.searchTerm, '');
  publish(CHANNELS.searchResults, [] as Movie[]);
  publish(CHANNELS.currentPage, 1);
  publish(CHANNELS.searchError, null);
  publish(CHANNELS.searchLoading, false);
}

/**
 * Full search flow. Publishing the term here (and not only on typing) keeps the URL, the channel
 * and the input field of every page in sync, because they all read the same channel.
 */
export async function runSearch(term: string, page = 1, pageSize = 12): Promise<void> {
  const normalizedTerm = term.trim();

  publish(CHANNELS.searchTerm, normalizedTerm);
  publish(CHANNELS.searchError, null);

  if (!normalizedTerm) {
    resetSearch();
    return;
  }

  const { signal, isCurrent } = startRequest('search');
  publish(CHANNELS.searchLoading, true);
  publish(CHANNELS.searchResults, [] as Movie[]);
  publish(CHANNELS.currentPage, 1);
  searchResultCount = 0;

  try {
    const movies = await searchMovies(normalizedTerm, signal);
    if (!isCurrent()) {
      return;
    }

    searchResultCount = movies.length;
    publish(CHANNELS.searchResults, movies);
    publish(CHANNELS.currentPage, getPageSlice(movies, page, pageSize).page);
  } catch (error) {
    if (isCurrent() && (error as Error).name !== 'AbortError') {
      publish(CHANNELS.searchError, toMessage(error, 'No se pudo completar la búsqueda.'));
    }
  } finally {
    if (isCurrent()) {
      publish(CHANNELS.searchLoading, false);
    }
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Movie detail                                                                                  */
/* -------------------------------------------------------------------------------------------- */

/** Called by `<movie-card>` when the user picks a movie. */
export function selectMovie(movie: Movie | null): void {
  publish(CHANNELS.selectedMovie, movie);
}

/** Loads the full detail of a movie (including its cast). */
export async function loadMovieDetail(id: number): Promise<void> {
  publish(CHANNELS.movieError, null);

  const { signal, isCurrent } = startRequest('movie');
  publish(CHANNELS.movieLoading, true);

  try {
    const movie = await getMovieById(id, signal);
    if (!isCurrent()) {
      return;
    }
    publish(CHANNELS.movieDetail, movie);
  } catch (error) {
    if (isCurrent() && (error as Error).name !== 'AbortError') {
      publish(CHANNELS.movieDetail, null);
      publish(CHANNELS.movieError, toMessage(error, 'No se pudo cargar el detalle.'));
    }
  } finally {
    if (isCurrent()) {
      publish(CHANNELS.movieLoading, false);
    }
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Popular movies (home)                                                                         */
/* -------------------------------------------------------------------------------------------- */

/** Loads one page of the "popular now" catalog. */
export async function loadPopularMovies(page: number): Promise<void> {
  publish(CHANNELS.popularError, null);

  const { signal, isCurrent } = startRequest('popular');
  publish(CHANNELS.popularLoading, true);

  try {
    const { movies } = await getPopularMovies(page, signal);
    if (!isCurrent()) {
      return;
    }
    publish(CHANNELS.popularMovies, movies);
    publish(CHANNELS.popularPage, page);
  } catch (error) {
    if (isCurrent() && (error as Error).name !== 'AbortError') {
      publish(CHANNELS.popularError, toMessage(error, 'No se pudieron cargar las películas populares.'));
    }
  } finally {
    if (isCurrent()) {
      publish(CHANNELS.popularLoading, false);
    }
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Theme                                                                                         */
/* -------------------------------------------------------------------------------------------- */

/**
 * Applies and persists a visual mode. The DOM change is done through the CSS custom properties
 * declared in `src/css/colors.css`, and the mode itself is broadcast so any component can react
 * (the header control, the toggle inside the pages, ...).
 */
export function setThemeMode(mode: ThemeMode): void {
  applyTheme(mode);
  persistTheme(mode);
  publish(CHANNELS.themeMode, mode);
}

/** Flips the current visual mode. */
export function toggleThemeMode(current: ThemeMode): ThemeMode {
  const next = oppositeTheme(current);
  setThemeMode(next);
  return next;
}