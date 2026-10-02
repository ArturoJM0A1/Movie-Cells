import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementController } from '@open-cells/element-controller';
import { CHANNELS } from '../state/app-state.js';
import { toggleThemeMode } from '../state/movie-store.js';
import { styles } from './theme-toggle.css.js';

// Material Web components provided by the Open Cells stack (no extra icon/UI library needed).
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/outlined-icon-button.js';

/**
 * Open Cells: reusable component + property + channel.
 *
 * - `@customElement` registers the class in the custom elements registry, so it can be used from
 *   any template simply as `<theme-toggle mode="dark"></theme-toggle>`.
 * - `ElementController` (from `@open-cells/element-controller`) is the Cells API that gives *any*
 *   element `subscribe` / `publish` / `navigate`, without having to extend a Cells base class.
 * - The visual mode arrives through the `theme-mode` channel, so the control stays correct even if
 *   it is re-created (view cache eviction) after the user has already switched the theme.
 * - The click does not mutate the component directly: it calls the store action, which applies the
 *   CSS attributes, persists the choice and broadcasts the new mode. Single source of truth.
 */
// @ts-ignore
@customElement('theme-toggle')
export class ThemeToggle extends LitElement {
  // Open Cells (element-controller): grants subscribe/publish/navigate on this element.
  private elementController = new ElementController(this);

  static styles = styles;

  /** Current visual mode. Reflected so it can be inspected or overridden from the outside. */
  @property({ type: String, reflect: true })
  mode: ThemeMode = 'light';

  connectedCallback() {
    super.connectedCallback();

    // Open Cells (channel): late subscribers immediately receive the last published value.
    this.elementController.subscribe(CHANNELS.themeMode, (mode: ThemeMode) => {
      this.mode = mode;
    });
  }

  disconnectedCallback() {
    // Open Cells (channel): release the subscription so the channel stops holding this element.
    this.elementController.unsubscribe(CHANNELS.themeMode);
    super.disconnectedCallback();
  }

  render() {
    const isDark = this.mode === 'dark';

    return html`
      <md-outlined-icon-button
        toggle
        ?selected=${isDark}
        aria-label=${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title=${isDark ? 'Modo claro' : 'Modo oscuro'}
        @click=${this._onToggle}
      >
        <md-icon>dark_mode</md-icon>
        <md-icon slot="selected" filled>light_mode</md-icon>
      </md-outlined-icon-button>
    `;
  }

  private _onToggle() {
    // Open Cells (state): the action applies the theme, persists it and re-publishes `theme-mode`,
    // which flows back into `mode` through the subscription above.
    toggleThemeMode(this.mode);
  }
}