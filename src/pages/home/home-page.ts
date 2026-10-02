import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { PageTransitionsMixin } from '@open-cells/page-transitions';
import { PageMixin } from '@open-cells/page-mixin';
import { CHANNELS } from '../../state/app-state.js';
import { loadPopularMovies } from '../../state/movie-store.js';

// Web Components used by this page (Open Cells composes plain custom elements).
import '../../components/page-layout.js';
import { PageLayout } from '../../components/page-layout.js';
import '../../components/movie-card.js';
import '../../components/movie-search-bar.js';
import '../../components/movie-pagination.js';
import '../../components/status-view.js';

/**
 * Open Cells: a page is a Web Component rendered into `#app-content` by the Cells router.
 *
 * Three Cells APIs are combined here:
 *  - `PageTransitionsMixin(PageMixin(LitElement))` gives the page the `state` attribute
 *    (active/inactive/cached), the fade transition and the `onPageEnter` / `onPageLeave` hooks.
 *  - `createRenderRoot() { return this }` renders in the *light DOM*, so page content is styled by
 *    the global stylesheet (`src/css/*.css`) instead of a shadow root.
 *  - `subscribe()` / `navigate()` (from `PageMixin`) bind the page to the shared channels and to
 *    the router, so this page never talks to the API directly: it only reads channels and dispatches
 *    store actions, which keeps the data flow in one place.
 */
// @ts-ignore
@customElement('home-page')
export class HomePage extends PageTransitionsMixin(PageMixin(LitElement)) {
  private _layout: PageLayout | null = null;

  protected createRenderRoot(): Element | ShadowRoot {
    // @ts-ignore
    return this;
  }

  /** Replicated channel values. `@state` makes Lit re-render when they change. */
  @state()
  protected _popularMovies: Movie[] = [];

  @state()
  protected _popularLoading = false;

  @state()
  protected _popularError: string | null = null;

  @state()
  protected _popularPage = 1;

  connectedCallback() {
    super.connectedCallback();

    // Open Cells (channel): the initial `publish` of a channel is replayed to late subscribers, so
    // coming back from a detail page renders the grid instantly, with no extra request.
    this.subscribe(CHANNELS.popularMovies, (movies: Movie[]) => {
      this._popularMovies = movies;
    });
    this.subscribe(CHANNELS.popularLoading, (loading: boolean) => {
      this._popularLoading = loading;
    });
    this.subscribe(CHANNELS.popularError, (error: string | null) => {
      this._popularError = error;
    });
    this.subscribe(CHANNELS.popularPage, (page: number) => {
      this._popularPage = page;
    });
  }

  disconnectedCallback() {
    this.unsubscribe(CHANNELS.popularMovies);
    this.unsubscribe(CHANNELS.popularLoading);
    this.unsubscribe(CHANNELS.popularError);
    this.unsubscribe(CHANNELS.popularPage);
    super.disconnectedCallback();
  }

  async firstUpdated(props: any) {
    super.firstUpdated?.(props);

    this._layout = this.querySelector('page-layout');

    // Only fetch when the channel is empty: a cached page keeps showing what it already has.
    if (!this._popularMovies.length && !this._popularLoading) {
      loadPopularMovies(1);
    }
  }

  render() {
    return html`
      <page-layout>
        <section class="home-hero">
          <h2>Encuentra tu próxima película</h2>
          <p>Busca por título en el catálogo de TVMaze y guarda tus favoritos en la pantalla.</p>

          <!-- Property in / event out: the bar receives the term, emits the submission. -->
          <movie-search-bar
            label="Buscar películas"
            action="Buscar"
            @search-submit=${this._onSearchSubmit}
          ></movie-search-bar>
        </section>

        <section class="home-popular">
          <div class="page-header">
            <h3>Populares ahora</h3>
          </div>

          <status-view
            state=${this._popularError ? 'error' : this._popularLoading ? 'loading' : ''}
            message=${this._popularError ?? 'Cargando películas populares…'}
            action-label="Reintentar"
            @status-retry=${() => loadPopularMovies(this._popularPage)}
          ></status-view>

          ${this._popularError
            ? nothing
            : html`
                <div class="movie-grid">
                  ${map(
                    this._popularMovies,
                    movie => html`
                      <movie-card
                        .movie=${movie}
                        @movie-select=${this._onMovieSelect}
                      ></movie-card>
                    `,
                  )}
                </div>

                <movie-pagination
                  page=${this._popularPage}
                  label="Páginas de populares"
                  @page-change=${this._onPopularPageChange}
                ></movie-pagination>
              `}
        </section>
      </page-layout>
    `;
  }

  /**
   * Navigating instead of running the search here keeps a single source of truth: the results page
   * is the one that owns the query, and the URL stays shareable (`#!/search?term=matrix`).
   */
  private _onSearchSubmit(event: CustomEvent<string>) {
    this.navigate('search', { term: event.detail });
  }

  private _onMovieSelect(event: CustomEvent<Movie>) {
    this.navigate('movie', { movieId: `${event.detail.id}` });
  }

  private _onPopularPageChange(event: CustomEvent<{ page: number }>) {
    loadPopularMovies(event.detail.page);
  }

  onPageLeave() {
    // Open Cells (page lifecycle): back to the top whenever we navigate away.
    this._layout?.resetScroll();
  }
}