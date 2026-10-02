/**
 * Client side pagination helpers.
 *
 * The search endpoint of the public catalog returns every match at once, so the paging is applied
 * over the array already stored in the `search-results` channel. The helpers stay pure so both the
 * page (to render) and the state layer (to validate a page coming from the URL) share the same rules.
 */
import { toPageNumber } from './format.js';

type PageSlice = {
  /** Movies that belong to the requested page. */
  movies: Movie[];
  /** Page that was actually applied (never out of range). */
  page: number;
  /** Total amount of pages, always >= 1. */
  totalPages: number;
};

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

/**
 * Clamps a page number to `[1, totalPages]`. Useful when the amount of items is known but the slice
 * itself is not needed (for instance to validate a page that comes from the URL or from a click on
 * the paginator).
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(toPageNumber(page, 1), 1), Math.max(1, totalPages));
}

/**
 * Returns the movies of `page` clamped to the available range, plus the pagination metadata.
 * `pageSize <= 0` would make the arithmetic meaningless, so it is normalized to 1.
 */
export function getPageSlice(movies: Movie[], page: number, pageSize: number): PageSlice {
  const size = Math.max(1, pageSize);
  const totalPages = getTotalPages(movies.length, size);
  const current = Math.min(Math.max(toPageNumber(page, 1), 1), totalPages);
  const start = (current - 1) * size;

  return {
    movies: movies.slice(start, start + size),
    page: current,
    totalPages,
  };
}