import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { setSearchTerm } from '../state/movie-store.js';
import { styles } from './movie-search-bar.css.js';

// Material Web components provided by the Open Cells stack.
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';

/**
 * Open Cells: Web Component composition with properties in / events out.
 *
 * The component is dumb on purpose. It owns no application state:
 *  - `value` is a *property* pushed by the page (`<movie-search-bar .value=${term}>`), which is how
 *    a parent keeps a child in sync without reaching into its shadow root.
 *  - while typing it publishes the term on the `search-term` channel (Open Cells pub/sub) so every
 *    other instance of the bar in the app shows the same text.
 *  - submitting dispatches a plain `CustomEvent` (`search-submit`), the standard Web Components way
 *    of notifying the parent, which then decides what to do (usually `navigate()` through Cells).
 */
// @ts-ignore
@customElement('movie-search-bar')
export class MovieSearchBar extends LitElement {
  static styles = styles;

  /** Current text. Set from the outside, updated internally while typing. */
  @property({ type: String })
  value = '';

  /** Floating label of the Material text field. */
  @property({ type: String })
  label = 'Buscar películas';

  /** Text of the submit button. */
  @property({ type: String })
  action = 'Buscar';

  /** Disables both controls (e.g. while a request is in flight). */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // The real Material Web element. Queried so we can read `.value` and call `.focus()`.
  @query('md-outlined-text-field')
  private _field!: { value: string; focus: () => void };

  render() {
    return html`
      <form role="search" @submit=${this._onSubmit}>
        <md-outlined-text-field
          aria-label=${this.label}
          label=${this.label}
          placeholder="Matrix, Inception, Chernobyl…"
          type="search"
          .value=${this.value}
          ?disabled=${this.disabled}
          @input=${this._onInput}
        >
          <md-icon slot="leading-icon">search</md-icon>
        </md-outlined-text-field>

        <md-filled-button type="submit" ?disabled=${this.disabled || !this.value.trim()}>
          <md-icon slot="icon">search</md-icon>
          ${this.action}
        </md-filled-button>
      </form>
    `;
  }

  /** Moves the caret to the input. Public so the pages can focus it after navigating. */
  focusField() {
    this._field?.focus();
  }

  private _onInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;

    // Open Cells (channel): broadcast the term; the pages keep their own copy in sync from it.
    setSearchTerm(this.value);
    this._dispatch('search-term-input', this.value);
  }

  private _onSubmit(event: Event) {
    event.preventDefault();
    const term = this.value.trim();

    if (!term) {
      return;
    }
    this._dispatch('search-submit', term);
  }

  /**
   * Standard Web Components communication: a bubbling + composed `CustomEvent`, so it crosses the
   * shadow boundary and reaches the page that declared `<movie-search-bar>` in its template.
   */
  private _dispatch(name: string, detail: string) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}