/**
 * Open Cells state: the list of channels of the application.
 *
 * Open Cells does not have a store library, and that is a feature here: components talk to each
 * other through *channels* (`publish` / `subscribe`) resolved by the Cells bridge. Any Web Component
 * of the app can read or write the same value without importing its owner.
 *
 * Two properties of the Cells implementation make this work as real shared state:
 *  - every channel is an RxJS `ReplaySubject(1)`, so a component that subscribes *late* (e.g. the
 *    results page is re-created after being evicted from the view cache) immediately receives the
 *    last published value instead of an empty state;
 *  - `publish`/`subscribe` are decoupled from the DOM, so pages that are not rendered at the same
 *    time still share the data.
 *
 * Channel names are grouped by domain and are the only "contract" components need to know about.
 */
export const CHANNELS = {
  /** Search term currently typed/selected. `string` */
  searchTerm: 'search-term',
  /** Movies matching the current term. `Movie[]` */
  searchResults: 'search-results',
  /** Whether a search request is in flight. `boolean` */
  searchLoading: 'search-loading',
  /** Human readable error of the last search, `null` when there is none. `string | null` */
  searchError: 'search-error',
  /** 1-based page of the search results. `number` */
  currentPage: 'current-page',

  /** Movie picked by the user in a grid. `Movie | null` */
  selectedMovie: 'selected-movie',
  /** Full detail (including cast) of the movie being displayed. `Movie | null` */
  movieDetail: 'movie-detail',
  /** Whether the detail request is in flight. `boolean` */
  movieLoading: 'movie-loading',
  /** Error of the last detail request. `string | null` */
  movieError: 'movie-error',

  /** Movies of the "popular" section. `Movie[]` */
  popularMovies: 'popular-movies',
  /** 1-based page loaded on the "popular" section. `number` */
  popularPage: 'popular-page',
  /** Whether the popular request is in flight. `boolean` */
  popularLoading: 'popular-loading',
  /** Error of the last popular request. `string | null` */
  popularError: 'popular-error',

  /** Visual mode of the application. `ThemeMode` */
  themeMode: 'theme-mode',

  /**
   * Scroll position published by `<page-layout>` and consumed by `<app-index>` to collapse the
   * header. Demonstrates that channels also carry plain UI signals, not only domain data.
   */
  scroll: 'scroll',
} as const;

export type ChannelName = (typeof CHANNELS)[keyof typeof CHANNELS];

/** Payload emitted on `CHANNELS.scroll`. */
type ScrollSignal = { scrollTop: number };

/** Re-exported so components do not need to import from `utils/format`. */
export type { ScrollSignal };