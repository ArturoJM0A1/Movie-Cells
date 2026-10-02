import { startApp } from '@open-cells/core';
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ElementController } from '@open-cells/element-controller';
import { routes } from '../router/routes.js';
import { styles } from './app-index.css.js';
import { CHANNELS, type ScrollSignal } from '../state/app-state.js';
import { applyTheme, readStoredTheme } from '../utils/theme.js';
import '@material/web/icon/icon.js';
import '@open-cells/page-transitions/page-transition-head-styles.js';
import { appConfig } from '../config/app.config.js';
// Registers the Web Components used by the shell (`<theme-toggle>`).
import './theme-toggle.js';

/**
 * Open Cells: application entry point.
 *
 * `startApp()` is the Cells bootstrap: it reads the `app-config` module, registers the router with
 * the declared routes and takes over of `#app-content`, swapping the page elements on navigation.
 * Everything the app needs at runtime (config, routes, shared stylesheets) comes from the files
 * imported above, there is no global mutable singleton beyond the Cells bridge itself.
 */
startApp({
  // Where the pages are rendered.
  mainNode: 'app-content',
  // Cells view cache: how many pages are kept alive in memory (back/forward feels instant).
  viewLimit: 3,
  // Detail pages are the ones users jump back and forth from, so they are never evicted.
  persistentPages: ['movie'],
  // Configuration module read by `getConfig()` (`src/config/app.config.js`).
  appConfig,
  // The router table.
  routes,
});

/**
 * Applies the stored (or OS) scheme *before* the first render, otherwise the app would paint once
 * in light mode and then repaint in dark - a flash that `readStoredTheme` alone cannot avoid.
 */
const initialThemeMode = readStoredTheme();
applyTheme(initialThemeMode);

/**
 * Open Cells: the shell Web Component.
 *
 * It owns the parts of the UI that must live above the router outlet: the header, the brand link
 * (a plain anchor to `#!/`, so it navigates through the Cells router and not the browser) and the
 * theme control. It also listens to the `scroll` channel published by `<page-layout>` to collapse
 * the header on scroll, which is a good example of page → shell communication without any import
 * between them.
 */
// @ts-ignore
@customElement('app-index')
export class AppIndex extends LitElement {
  // Open Cells (element-controller): grants subscribe/publish/navigate on this element.
  private elementController = new ElementController(this);

  private _header: HTMLElement | undefined | null = null;

  static styles = styles;

  /** Mirrors the `theme-mode` channel so `<theme-toggle>` receives it as a property. */
  @state()
  protected _themeMode: ThemeMode = initialThemeMode;

  connectedCallback() {
    super.connectedCallback();

    // Open Cells (channel): `<page-layout>` publishes the scroll position of its scroller.
    this.elementController.subscribe(CHANNELS.scroll, (data: ScrollSignal) =>
      this._headerTransition(data),
    );

    // Open Cells (channel): any component can change the theme; the header reacts.
    this.elementController.subscribe(CHANNELS.themeMode, (mode: ThemeMode) => {
      this._themeMode = mode;
    });
  }

  disconnectedCallback() {
    this.elementController.unsubscribe(CHANNELS.scroll);
    this.elementController.unsubscribe(CHANNELS.themeMode);
    super.disconnectedCallback();
  }

  firstUpdated(props: any) {
    super.firstUpdated(props);

    this._header = this.shadowRoot?.querySelector('header') as HTMLElement;
  }

  render() {
    return html`
      ${this._headerTpl}

      <main role="main" tabindex="-1">
        <slot></slot>
      </main>
    `;
  }

  get _headerTpl() {
    return html`
      <header>
        <div class="header-content">
          <div class="header-logo">
            <md-icon>movie</md-icon>
            <h1><a href="#!/">Movie Cells</a></h1>
          </div>
          <!--
            Web Component composition: theme-toggle owns no navigation and no theme logic. It
            receives the mode as a property and, on click, calls the store action, which applies
            the theme and re-publishes the theme-mode channel (subscribed above).
          -->
          <theme-toggle mode=${this._themeMode}></theme-toggle>
        </div>
      </header>
    `;
  }

  /** Collapses the header as soon as the page scrolls down (Cells channel `scroll`). */
  private _headerTransition({ scrollTop }: ScrollSignal) {
    this._header?.classList.toggle('scrolled', scrollTop > 0);
  }
}