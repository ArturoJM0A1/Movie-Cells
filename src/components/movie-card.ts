import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { formatRating, formatRuntime, joinMeta } from '../utils/format.js';
import { styles } from './movie-card.css.js';

// Material Web components provided by the Open Cells stack.
import '@material/web/icon/icon.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/chips/chip-set.js';

/** How many genres we show before collapsing the rest. */
const MAX_VISIBLE_GENRES = 3;

/**
 * Open Cells: property in / event out.
 *
 * `movie` is a plain Lit property, so any page can render the card without knowing anything about
 * its internals: `<movie-card .movie=${movie}></movie-card>`. The card never navigates by itself;
 * it dispatches `movie-select` and the page decides (usually `navigate('movie', { id })` through
 * the Cells router). That keeps routing in one place.
 */
// @ts-ignore
@customElement('movie-card')
export class MovieCard extends LitElement {
  static styles = styles;

  /** Movie to render. Passed as a property (not an attribute) because it is an object. */
  @property({ type: Object })
  movie: Movie | null = null;

  render() {
    if (!this.movie) {
      return nothing;
    }

    const { title, poster, year, genres, rating, runtime } = this.movie;
    const ratingLabel = formatRating(rating);
    const visibleGenres = genres.slice(0, MAX_VISIBLE_GENRES);
    const remainingGenres = genres.length - visibleGenres.length;

    return html`
      <article>
        <div class="poster">
          ${poster
            ? html`
                <img src=${poster} alt="Cartel de ${title}" loading="lazy" decoding="async" />
              `
            : html`
                <div class="poster-placeholder">
                  <md-icon>movie</md-icon>
                </div>
              `}
        </div>

        <div class="body">
          <h3>${title}</h3>

          <p class="meta">${joinMeta(year, formatRuntime(runtime)) || 'Sin metadatos'}</p>

          ${ratingLabel
            ? html`
                <p class="rating">
                  <md-icon filled>star</md-icon>
                  ${ratingLabel}
                </p>
              `
            : nothing}

          ${visibleGenres.length
            ? html`
                <md-chip-set aria-label="Géneros">
                  ${visibleGenres.map(
                    genre => html`<md-assist-chip label=${genre}></md-assist-chip>`,
                  )}
                  ${remainingGenres > 0
                    ? html`<md-assist-chip label=${`+${remainingGenres}`}></md-assist-chip>`
                    : nothing}
                </md-chip-set>
              `
            : nothing}
        </div>

        <md-filled-tonal-button @click=${this._onSelect}>
          <md-icon slot="icon">arrow_forward</md-icon>
          Ver detalle
        </md-filled-tonal-button>
      </article>
    `;
  }

  /**
   * Standard Web Components communication: bubbling + composed so the event escapes the shadow root
   * and reaches the page, which owns the routing.
   */
  private _onSelect() {
    this.dispatchEvent(
      new CustomEvent('movie-select', {
        detail: this.movie,
        bubbles: true,
        composed: true,
      }),
    );
  }
}