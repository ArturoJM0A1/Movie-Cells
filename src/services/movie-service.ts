import { getConfig } from '@open-cells/core';
import { getJson } from './api-client.js';
import { stripHtml, getYear } from '../utils/format.js';

/**
 * Movie service: the only module that knows how the remote catalog is shaped.
 *
 * Open Cells note: the endpoint configuration is *not* hardcoded here. It is read with
 * `getConfig()` from `@open-cells/core`, which returns the very object passed to
 * `startApp({ appConfig })`. That is the Open Cells way of injecting configuration: pages and
 * components stay agnostic and the service adapts to whatever the app config declares.
 */

type MoviesServiceActions = {
  search: string;
  catalog: string;
  lookup: string;
};

type MoviesServiceConfig = {
  basePath?: string;
  pageSize?: number;
  castLimit?: number;
  actions?: Partial<MoviesServiceActions>;
};

const defaultActions: MoviesServiceActions = {
  search: 'search/shows',
  catalog: 'shows',
  lookup: 'shows/{id}',
};

const defaults = {
  basePath: 'https://api.tvmaze.com',
  pageSize: 12,
  castLimit: 6,
};

/** Configuration after the app config and the defaults have been merged. */
type ResolvedServiceConfig = Required<Omit<MoviesServiceConfig, 'actions'>> & {
  actions: MoviesServiceActions;
};

/**
 * Reads the service configuration through the Cells bridge.
 * Called on every request (never cached at module scope) so `startApp()` is always applied first.
 */
function getServiceConfig(): ResolvedServiceConfig {
  const fromAppConfig = (getConfig()?.appConfig?.moviesService as MoviesServiceConfig | undefined) ?? {};
  return {
    basePath: fromAppConfig.basePath ?? defaults.basePath,
    pageSize: fromAppConfig.pageSize ?? defaults.pageSize,
    castLimit: fromAppConfig.castLimit ?? defaults.castLimit,
    actions: { ...defaultActions, ...(fromAppConfig.actions ?? {}) },
  };
}

/* -------------------------------------------------------------------------------------------- */
/* Remote shapes. Only this file is allowed to know about them.                                  */
/* -------------------------------------------------------------------------------------------- */

type RemoteImage = { medium?: string; original?: string } | null;

type RemoteMovie = {
  id: number;
  name?: string;
  premiered?: string | null;
  image?: RemoteImage;
  summary?: string | null;
  genres?: string[] | null;
  rating?: { average?: number | null } | null;
  runtime?: number | null;
  averageRuntime?: number | null;
  status?: string | null;
  type?: string | null;
  language?: string | null;
  officialSite?: string | null;
  url?: string;
  network?: { name?: string } | null;
  webChannel?: { name?: string } | null;
};

type RemoteSearchResult = { score?: number; show?: RemoteMovie | null };

type RemoteCastEntry = {
  person?: { name?: string; image?: RemoteImage } | null;
  character?: { name?: string | null } | null;
};

type RemoteShowWithCast = RemoteMovie & { _embedded?: { cast?: RemoteCastEntry[] } | null };

/* -------------------------------------------------------------------------------------------- */
/* Transformers: remote -> Movie. This is where "transformar los datos" of the API layer lives. */
/* -------------------------------------------------------------------------------------------- */

function toCastEntry(entry: RemoteCastEntry): CastMember {
  return {
    name: entry.person?.name ?? 'Desconocido',
    character: entry.character?.name ?? '',
    image: entry.person?.image?.medium ?? '',
  };
}

function toMovie(remote: RemoteMovie, cast: CastMember[] = []): Movie {
  return {
    id: remote.id,
    title: remote.name ?? 'Sin título',
    year: getYear(remote.premiered ?? ''),
    // `original` is the biggest available image; `medium` is the safe fallback.
    poster: remote.image?.original ?? remote.image?.medium ?? '',
    summary: stripHtml(remote.summary ?? ''),
    genres: remote.genres ?? [],
    rating: remote.rating?.average ?? null,
    runtime: remote.runtime ?? remote.averageRuntime ?? null,
    status: remote.status ?? '',
    type: remote.type ?? '',
    language: remote.language ?? '',
    network: remote.network?.name ?? remote.webChannel?.name ?? null,
    officialSite: remote.officialSite ?? null,
    url: remote.url ?? '',
    cast,
  };
}

/* -------------------------------------------------------------------------------------------- */
/* Public API of the service.                                                                   */
/* -------------------------------------------------------------------------------------------- */

/**
 * Full text search. Returns every match; pagination is applied by the state layer because this
 * endpoint does not support paging.
 */
export async function searchMovies(term: string, signal?: AbortSignal): Promise<Movie[]> {
  const { basePath, actions } = getServiceConfig();
  const results = await getJson<RemoteSearchResult[]>({
    basePath,
    path: actions.search,
    query: { q: term },
    signal,
  });

  return (results ?? [])
    .map(result => result.show)
    .filter((show): show is RemoteMovie => Boolean(show?.id))
    .map(show => toMovie(show));
}

/**
 * Paginated catalog, used by the home page as "popular now".
 * The API returns ~250 shows per page and does not report the total amount of pages, so the
 * response is sliced to the configured page size and `totalPages` is `null`. The pagination
 * component then falls back to a previous/next control with no "last" limit.
 */
export async function getPopularMovies(page: number, signal?: AbortSignal): Promise<PagedMovies> {
  const { basePath, actions, pageSize } = getServiceConfig();
  const remote = await getJson<RemoteMovie[]>({
    basePath,
    path: actions.catalog,
    query: { page },
    signal,
  });

  const movies = (remote ?? [])
    .filter(show => Boolean(show?.id))
    .slice(0, pageSize)
    .map(show => toMovie(show));

  return { movies, page, totalPages: null };
}

/**
 * Single movie, including its cast (requested through `embed=cast`, so one request is enough).
 */
export async function getMovieById(id: number, signal?: AbortSignal): Promise<Movie> {
  const { basePath, actions, castLimit } = getServiceConfig();
  const remote = await getJson<RemoteShowWithCast>({
    basePath,
    path: actions.lookup,
    params: { id },
    query: { embed: 'cast' },
    signal,
  });

  const cast = (remote?._embedded?.cast ?? []).slice(0, castLimit).map(toCastEntry);

  return toMovie(remote, cast);
}

/**
 * Amount of cards per page, read from the app configuration. Used by the home grid and by the
 * client side pagination of the search results, so both stay in sync with a single setting.
 */
export function getPageSize(): number {
  return getServiceConfig().pageSize;
}