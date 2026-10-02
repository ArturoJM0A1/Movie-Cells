/**
 * Minimal HTTP layer.
 *
 * Open Cells does not ship a data-fetching solution, so we build one on top of the platform:
 * `fetch` + `URL` + `AbortController`. The important part for this project is the *separation*:
 * components never build URLs nor touch `fetch`; they call `src/services/movie-service.ts`, which
 * is the only layer that knows about the remote API.
 */

/** Error thrown for every failed request, so callers can branch on `status`. */
export class ApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }

  /** `404` -> true. Used by pages to show a "movie not found" state. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** `0` means the request never reached the server (offline, DNS failure, CORS, ...). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

export type QueryParams = Record<string, string | number>;

export type RequestOptions = {
  /** Absolute base URL of the API. */
  basePath: string;
  /** Path relative to `basePath`. It may contain `{placeholders}`. */
  path: string;
  /** Query string values, skipped when `undefined`. */
  query?: QueryParams;
  /** Replaces `{placeholders}` in `path`. */
  params?: Record<string, string | number>;
  /** Lets the caller cancel a request that is no longer relevant. */
  signal?: AbortSignal;
};

/**
 * Builds the final URL. Kept as a pure function so it is trivial to test and to reason about.
 */
export function buildUrl({ basePath, path, params, query }: RequestOptions): URL {
  const filledPath = Object.entries(params ?? {}).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    path,
  );
  const url = new URL(`${basePath.replace(/\/$/, '')}/${filledPath.replace(/^\//, '')}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url;
}

/**
 * Performs a `GET` request and returns the parsed JSON body.
 *
 * Responsibilities kept here (and nowhere else):
 *  - URL building
 *  - the actual `fetch` call
 *  - HTTP error handling (`!response.ok` -> `ApiError`)
 *  - network / parsing error normalization
 */
export async function getJson<T>(options: RequestOptions): Promise<T> {
  const url = buildUrl(options);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: options.signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }
    throw new ApiError('No se pudo conectar con el servidor de películas.', 0, url.toString());
  }

  if (!response.ok) {
    const reason = response.statusText ? ` (${response.statusText})` : '';
    throw new ApiError(
      `La API respondió con un error ${response.status}${reason}.`,
      response.status,
      url.toString(),
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('La respuesta de la API no es un JSON válido.', response.status, url.toString());
  }
}