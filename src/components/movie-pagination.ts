import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './movie-pagination.css.js';

// Material Web components provided by the Open Cells stack.
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/outlined-icon-button.js';

/**
 * Open Cells: reusable component for the "current page" state.
 *
 * It knows nothing about movies: it only renders a previous/next control around the page number
 * and emits `page-change`. The pages translate that into `setCurrentPage(...)` (which publishes on
 * the `current-page` channel) and, in the results page, into a router navigation so the page
 * number lives in the URL.
 *
 * `totalPages` is optional because the public catalog reports the page but not the total amount of
 * pages for the "popular" endpoint, while the search results (paginated locally) always know it.
 */
// @ts-ignore
@customElement('movie-pagination')
export class MoviePagination extends LitElement {
  static styles = styles;

  /** 1-based current page. */
  @property({ type: Number })
  page = 1;

  /** Total amount of pages. Omit / `0` when it is unknown. */
  @property({ type: Number, attribute: 'total-pages' })
  totalPages = 0;

  /** Screen reader label of the group. */
  @property({ type: String })
  label = 'Paginación';

  render() {
    const hasPrevious = this.page > 1;
    const hasNext = this.totalPages > 0 ? this.page < this.totalPages : true;

    // Nothing to paginate: render no markup so the host collapses to zero height.
    if (!hasPrevious && !hasNext) {
      return nothing;
    }

    return html`
      <nav aria-label=${this.label}>
        <md-outlined-icon-button
          aria-label="Página anterior"
          title="Página anterior"
          ?disabled=${!hasPrevious}
          @click=${() => this._goTo(this.page - 1)}
        >
          <md-icon>chevron_left</md-icon>
        </md-outlined-icon-button>

        <span class="label" aria-live="polite">
          ${this.totalPages > 0
            ? `Página ${this.page} de ${this.totalPages}`
            : `Página ${this.page}`}
        </span>

        <md-outlined-icon-button
          aria-label="Página siguiente"
          title="Página siguiente"
          ?disabled=${!hasNext}
          @click=${() => this._goTo(this.page + 1)}
        >
          <md-icon>chevron_right</md-icon>
        </md-outlined-icon-button>
      </nav>
    `;
  }

  private _goTo(page: number) {
    // Standard Web Components communication: the owner decides what a page change means.
    this.dispatchEvent(
      new CustomEvent('page-change', {
        detail: { page: Math.max(1, page) },
        bubbles: true,
        composed: true,
      }),
    );
  }
}