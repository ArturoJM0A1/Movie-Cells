/**
 * Open Cells application configuration.
 *
 * `startApp({ appConfig })` (see `src/components/app-index.ts`) stores this object inside the Cells
 * bridge, and any module can read it back at runtime with `getConfig()` from `@open-cells/core`.
 * That is the Open Cells way of sharing *configuration* between services and components without
 * importing singletons around the app.
 */
export const appConfig = {
  moviesService: {
    /** Public catalog API. Keyless and CORS friendly, so it works directly from the browser. */
    basePath: 'https://api.tvmaze.com',
    /** Cards shown per page: home "popular now" and the (client side) search results. */
    pageSize: 12,
    /** Cast members embedded in the detail request. */
    castLimit: 6,
    actions: {
      /** Full text search: `GET /search/shows?q=...` */
      search: 'search/shows',
      /** Paginated catalog: `GET /shows?page=...` */
      catalog: 'shows',
      /** Single movie with its cast embedded: `GET /shows/{id}?embed=cast` */
      lookup: 'shows/{id}',
    },
  },
};