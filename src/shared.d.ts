/**
 * Global domain types.
 *
 * These types are intentionally declared as ambient globals (no `import`/`export` at the top of the
 * file) so every module of the app can use them without adding noise to the imports.
 *
 * Why this matters for Open Cells: the whole app is built from Web Components that are rendered in
 * different shadow roots / light DOM boundaries, and the Cells channels that travel between them
 * carry these very objects. A single shared contract keeps the components decoupled from the
 * remote API shape (see `src/services/movie-service.ts`, which normalizes the remote payload into
 * these types).
 */

/** A cast entry as returned by the public catalog API (normalized). */
type CastMember = {
  /** Full name of the actor/actress. */
  name: string;
  /** Character played in the movie. */
  character: string;
  /** Portrait image URL, empty string when the API has no image. */
  image: string;
};

/**
 * Normalized movie model. Every page and component works with this shape and never with the raw
 * remote payload.
 */
type Movie = {
  id: number;
  title: string;
  /** Release year as a plain string (e.g. `'1993'`), empty when unknown. */
  year: string;
  /** Absolute poster URL, empty string when the movie has no poster. */
  poster: string;
  /** Plain-text description (HTML already stripped by the service layer). */
  summary: string;
  /** Genres, always an array (possibly empty). */
  genres: string[];
  /** Average rating when the API provides one, otherwise `null`. */
  rating: number | null;
  /** Runtime in minutes when the API provides one, otherwise `null`. */
  runtime: number | null;
  /** Production status (`Ended`, `Running`, ...). */
  status: string;
  /** Type of production (`Scripted`, `Reality`, ...). */
  type: string;
  /** Original language. */
  language: string;
  /** Network / production company, `null` when unknown. */
  network: string | null;
  /** Public web page of the movie, `null` when unknown. */
  officialSite: string | null;
  /** Deep link to the public site of the catalog. */
  url: string;
  /** Cast. Empty for list endpoints, filled on the detail endpoint. */
  cast: CastMember[];
};

/** Result of a paginated request against the remote API. */
type PagedMovies = {
  movies: Movie[];
  /** 1-based page that was requested. */
  page: number;
  /** Total amount of pages, `null` when the API does not report it. */
  totalPages: number | null;
};

/** Visual mode of the application. Stored in `localStorage` and shared via a Cells channel. */
type ThemeMode = 'light' | 'dark';