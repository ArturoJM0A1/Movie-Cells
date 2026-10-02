import { html, LitElement, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { PageTransitionsMixin } from '@open-cells/page-transitions';
import { PageMixin } from '@open-cells/page-mixin';
import { CHANNELS } from '../../state/app-state.js';
import { loadMovieDetail } from '../../state/movie-store.js';
import { formatRating, formatRuntime, joinMeta, toPageNumber } from '../../utils/format.js';

import '../../components/page-layout.js';
import { PageLayout } from '../../components/page-layout.js';
import '../../components/status-view.js';
import '@material/web/icon/icon.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/chips/chip-set.js';
import '@material/web/divider/divider.js';
import '@material/web/list/list-item.js';
import '@material/web/list/list.js';

/**
 * Open Cells: the detail page (`#!/movie/:movieId`).
 *
 * `params.movieId` comes straight from the route pattern, so the page is fully addressable and can
 * be reloaded or shared. The page does not fetch by itself: `loadMovieDetail` (store action) fills
 * the `movie-detail` channel and this page only renders what it finds there, which also means the
 * result survives the Cells view cache being evicted.
 */
// @ts-ignore
@customElement('movie-page')
export class MoviePage extends PageTransitionsMixin(PageMixin(LitElement)) {
  private _layout: PageLayout | null = null;

  @state()
  protected _movie: Movie | null = null;

  @state()
  protected _loading = false;

  @state()
  protected _error: string | null = null;

  /**
   * Id whose detail is currently displayed. The Cells router re-assigns `params` (a brand new
   * object) on every selection, so this guard is what avoids requesting the same movie twice.
   */
  private _loadedId: number | null = null;

  protected createRenderRoot(): Element | ShadowRoot {
    // @ts-ignore
    return this;
  }

  connectedCallback() {
    super.connectedCallback();

    this.subscribe(CHANNELS.movieDetail, (movie: Movie | null) => {
      this._movie = movie;
    });
    this.subscribe(CHANNELS.movieLoading, (loading: boolean) => {
      this._loading = loading;
    });
    this.subscribe(CHANNELS.movieError, (error: string | null) => {
      this._error = error;
    });
  }

  disconnectedCallback() {
    this.unsubscribe(CHANNELS.movieDetail);
    this.unsubscribe(CHANNELS.movieLoading);
    this.unsubscribe(CHANNELS.movieError);
    super.disconnectedCallback();
  }

  firstUpdated(props: any) {
    super.firstUpdated?.(props);

    this._layout = this.querySelector('page-layout');
  }

  /** Same reactive-params trick as the results page: a new `movieId` in the URL reloads. */
  updated(props: PropertyValues) {
    super.updated?.(props);

    if (props.has('params')) {
      this._loadFromParams();
    }
  }

  private _loadFromParams() {
    const params = (this.params ?? {}) as Record<string, string>;
    const movieId = toPageNumber(params['movieId'], 0);

    if (!movieId) {
      // The route without an id is not a valid target for this page.
      this.navigate('not-found');
      return;
    }

    if (movieId === this._loadedId) {
      return;
    }

    this._loadedId = movieId;
    loadMovieDetail(movieId);
  }

  render() {
    return html`
      <page-layout>
        <div class="page-header">
          <a href="#!/">
            <md-icon filled>arrow_back</md-icon>
            Volver al inicio
          </a>
        </div>

        <status-view
          state=${this._error ? 'error' : this._loading && !this._movie ? 'loading' : ''}
          message=${this._error ?? 'Cargando detalle…'}
          action-label=${this._error ? 'Reintentar' : ''}
          @status-retry=${() => this._retry()}
        ></status-view>

        ${this._movie && !this._error ? this._movieTpl : nothing}
      </page-layout>
    `;
  }

  private get _movieTpl() {
    const movie = this._movie as Movie;
    const rating = formatRating(movie.rating);
    const meta = joinMeta(movie.year, formatRuntime(movie.runtime), movie.status);

    return html`
      <article class="movie-detail">
        <div class="movie-poster">
          ${movie.poster
            ? html`<img src=${movie.poster} alt="Cartel de ${movie.title}" />`
            : html`
                <div class="poster-placeholder">
                  <md-icon>movie</md-icon>
                </div>
              `}
        </div>

        <div class="movie-info">
          <h2>${movie.title}</h2>

          <p class="movie-meta">${meta}</p>

          <div class="movie-facts">
            ${rating
              ? html`
                  <span class="movie-fact">
                    <md-icon filled>star</md-icon>
                    ${rating}
                  </span>
                `
              : nothing}
            ${movie.network
              ? html`
                  <span class="movie-fact">
                    <md-icon>live_tv</md-icon>
                    ${movie.network}
                  </span>
                `
              : nothing}
            <span class="movie-fact">
              <md-icon>movie_filter</md-icon>
              ${movie.genres.length ? movie.genres.join(', ') : 'Sin géneros'}
            </span>
          </div>

          ${movie.genres.length
            ? html`
                <md-chip-set aria-label="Géneros">
                  ${movie.genres.map(
                    genre => html`<md-assist-chip label=${genre}></md-assist-chip>`,
                  )}
                </md-chip-set>
              `
            : nothing}

          <md-divider></md-divider>

          <section class="movie-summary">
            <h3>Resumen</h3>
            <p>${movie.summary || 'El catálogo no ofrece un resumen para esta película.'}</p>
          </section>

          ${this._castTpl}
        </div>
      </article>
    `;
  }

  private get _castTpl() {
    // The amount of cast members is already capped by the service (`moviesService.castLimit`).
    const cast = this._movie?.cast ?? [];

    if (!cast.length) {
      return nothing;
    }

    return html`
      <section class="movie-cast">
        <h3>Reparto</h3>
        <md-list aria-label="Reparto">
          ${cast.map(
            member => html`
              <md-list-item>
                <img slot="start" src=${member.image} alt="" loading="lazy" />
                <span slot="headline">${member.name}</span>
                <span slot="supporting-text">${member.character}</span>
              </md-list-item>
            `,
          )}
        </md-list>
      </section>
    `;
  }

  private _retry() {
    const params = (this.params ?? {}) as Record<string, string>;
    loadMovieDetail(toPageNumber(params['movieId'], 0));
  }

  onPageLeave() {
    // Open Cells (page lifecycle): back to the top whenever we navigate away.
    this._layout?.resetScroll();
  }
}