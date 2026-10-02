import { html, LitElement, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { PageTransitionsMixin } from '@open-cells/page-transitions';
import { PageMixin } from '@open-cells/page-mixin';
import { CHANNELS } from '../../state/app-state.js';
import { resetSearch, runSearch, setCurrentPage } from '../../state/movie-store.js';
import { getPageSize } from '../../services/movie-service.js';
import { getPageSlice } from '../../utils/pagination.js';
import { toPageNumber } from '../../utils/format.js';

import '../../components/page-layout.js';
import { PageLayout } from '../../components/page-layout.js';
import '../../components/movie-card.js';
import '../../components/movie-search-bar.js';
import '../../components/movie-pagination.js';
import '../../components/status-view.js';

/**
 * Amount of cards per page of results. Read from the app configuration (`moviesService.pageSize`)
 * so the grid of this page and the one of the home page always show the same amount of cards.
 */
const RESULTS_PAGE_SIZE = getPageSize();

/**
 * Open Cells: the results page.
 *
 * The page owns the *query*, and it is the only one reading the router params: `navigate('search',
 * { term })` produces `#!/search?term=…` and the values come back through the reactive `params`
 * property declared by `PageMixin`. Because `params` is reactive, a new URL - a deep link, the back
 * button, or a search submitted from the home page - reloads the results without re-mounting the
 * component.
 *
 * Paging, on the other hand, is applied over the results already stored in the `search-results`
 * channel, so moving between pages of a loaded result set never hits the network again. The page
 * number is still reflected in the URL, which makes the current page shareable.
 */
// @ts-ignore
@customElement('search-page')
export class SearchPage extends PageTransitionsMixin(PageMixin(LitElement)) {
  private _layout: PageLayout | null = null;

  /** Term of the results currently loaded. Also the value shown in the search bar. */
  @state()
  protected _term = '';

  /** `true` once a request for `_term` has been dispatched, to avoid re-running it needlessly. */
  private _termRequested = false;

  @state()
  protected _results: Movie[] = [];

  @state()
  protected _loading = false;

  @state()
  protected _error: string | null = null;

  @state()
  protected _page = 1;

  protected createRenderRoot(): Element | ShadowRoot {
    // @ts-ignore
    return this;
  }

  connectedCallback() {
    super.connectedCallback();

    // Open Cells (channel): the values are replayed, so a cached page renders instantly on return.
    this.subscribe(CHANNELS.searchResults, (results: Movie[]) => {
      this._results = results;
    });
    this.subscribe(CHANNELS.searchLoading, (loading: boolean) => {
      this._loading = loading;
    });
    this.subscribe(CHANNELS.searchError, (error: string | null) => {
      this._error = error;
    });
    this.subscribe(CHANNELS.currentPage, (page: number) => {
      this._page = page;
    });
  }

  disconnectedCallback() {
    this.unsubscribe(CHANNELS.searchResults);
    this.unsubscribe(CHANNELS.searchLoading);
    this.unsubscribe(CHANNELS.searchError);
    this.unsubscribe(CHANNELS.currentPage);
    super.disconnectedCallback();
  }

  firstUpdated(props: any) {
    super.firstUpdated?.(props);

    this._layout = this.querySelector('page-layout');
  }

  /**
   * Open Cells: reacting to `params` (a reactive property) is enough to cover the very first render
   * and every later URL change, so no request is dispatched twice on mount.
   */
  updated(props: PropertyValues) {
    super.updated?.(props);

    if (props.has('params')) {
      this._applyParams();
    }
  }

  /** Translates the router params into a request (new term) or a page change (same term). */
  private _applyParams() {
    const params = (this.params ?? {}) as Record<string, string>;
    const term = String(params['term'] ?? '').trim();
    const page = toPageNumber(params['page'], 1);

    if (!term) {
      // Opened without a query (`#!/search`): show the empty state instead of guessing.
      this._termRequested = false;
      this._term = '';
      resetSearch();
      return;
    }

    if (term === this._term && this._termRequested) {
      // Same results, only the page changed: slice locally instead of requesting again.
      const { page: validPage } = getPageSlice(this._results, page, RESULTS_PAGE_SIZE);
      setCurrentPage(validPage);
      return;
    }

    this._term = term;
    this._termRequested = true;
    runSearch(term, 1, RESULTS_PAGE_SIZE);
  }

  render() {
    const { movies, totalPages } = getPageSlice(this._results, this._page, RESULTS_PAGE_SIZE);
    const hasResults = this._results.length > 0;

    return html`
      <page-layout>
        <div class="page-header">
          <h2>${this._term ? `Resultados de "${this._term}"` : 'Busca una película'}</h2>
          ${hasResults && !this._error
            ? html`<p>${this._results.length} resultados encontrados</p>`
            : nothing}
        </div>

        <movie-search-bar
          label="Buscar películas"
          action="Buscar"
          .value=${this._term}
          ?disabled=${this._loading}
          @search-submit=${this._onSearchSubmit}
        ></movie-search-bar>

        <status-view
          state=${this._error ? 'error' : this._loading ? 'loading' : hasResults ? '' : 'empty'}
          message=${this._error ?? this._stateMessage(hasResults)}
          action-label=${this._error ? 'Reintentar' : ''}
          @status-retry=${() => runSearch(this._term, 1, RESULTS_PAGE_SIZE)}
        ></status-view>

        ${!this._error && hasResults
          ? html`
              <div class="movie-grid">
                ${map(
                  movies,
                  movie => html`
                    <movie-card
                      .movie=${movie}
                      @movie-select=${this._onMovieSelect}
                    ></movie-card>
                  `,
                )}
              </div>

              <movie-pagination
                page=${this._page}
                total-pages=${totalPages}
                @page-change=${this._onPageChange}
              ></movie-pagination>
            `
          : nothing}
      </page-layout>
    `;
  }

  private _stateMessage(hasResults: boolean): string {
    if (this._loading) {
      return 'Buscando películas…';
    }
    if (hasResults) {
      return '';
    }
    return this._term
      ? 'Ninguna película coincide con tu búsqueda.'
      : 'Escribe un título para empezar.';
  }

  private _onSearchSubmit(event: CustomEvent<string>) {
    // Reset the flag so the new term is always requested.
    this._termRequested = false;
    this.navigate('search', { term: event.detail, page: 1 });
  }

  private _onPageChange(event: CustomEvent<{ page: number }>) {
    this.navigate('search', { term: this._term, page: event.detail.page });
  }

  private _onMovieSelect(event: CustomEvent<Movie>) {
    this.navigate('movie', { movieId: `${event.detail.id}` });
  }

  onPageLeave() {
    // Open Cells (page lifecycle): back to the top whenever we navigate away.
    this._layout?.resetScroll();
  }
}