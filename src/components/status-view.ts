import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './status-view.css.js';

// Material Web components provided by the Open Cells stack.
import '@material/web/icon/icon.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/progress/circular-progress.js';

/** The three "non data" states every page of a data driven app needs. */
type StatusViewState = 'loading' | 'error' | 'empty';

const CONFIG: Record<
  StatusViewState,
  { icon: string; filled?: boolean; role: string }
> = {
  loading: { icon: 'progress_activity', filled: true, role: 'status' },
  error: { icon: 'error', filled: true, role: 'alert' },
  empty: { icon: 'search_off', role: 'status' },
};

/**
 * Open Cells: reusable component used by every page.
 *
 * Centralising loading / error / empty in a single Web Component guarantees that the three states
 * look and behave the same everywhere (home, results and detail pages) and removes duplicated
 * template code. The retry action is emitted as a `status-retry` event instead of being handled
 * here, so the owner of the data decides what "retry" means.
 */
// @ts-ignore
@customElement('status-view')
export class StatusView extends LitElement {
  static styles = styles;

  /** Omit the attribute to render nothing at all. */
  @property({ type: String, reflect: true })
  state: StatusViewState | '' = '';

  /** Text shown under the icon/spinner. */
  @property({ type: String })
  message = '';

  /** Label of the action button. When empty the button is not rendered. */
  @property({ type: String, attribute: 'action-label' })
  actionLabel = '';

  render() {
    if (!this.state) {
      return nothing;
    }

    const config = CONFIG[this.state as StatusViewState];

    return html`
      <div class="status" role=${config.role} aria-live="polite">
        ${this.state === 'loading'
          ? html`
              <!-- Open Cells / Material Web: the loading state is a real component, not CSS. -->
              <md-circular-progress aria-label="Cargando…" indeterminate value="0.5"></md-circular-progress>
            `
          : html`<md-icon ?filled=${Boolean(config.filled)}>${config.icon}</md-icon>`}

        ${this.message ? html`<p class="message">${this.message}</p>` : nothing}

        ${this.actionLabel
          ? html`
              <md-filled-tonal-button @click=${this._onAction}>
                ${this.state === 'error' ? 'Reintentar' : this.actionLabel}
              </md-filled-tonal-button>
            `
          : nothing}
      </div>
    `;
  }

  private _onAction() {
    this.dispatchEvent(new CustomEvent('status-retry', { bubbles: true, composed: true }));
  }
}