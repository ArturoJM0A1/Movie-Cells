import { html, LitElement } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { PageTransitionsMixin } from '@open-cells/page-transitions';
import { customElement } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';
import '../../components/page-layout.js';
import { PageLayout } from '../../components/page-layout.js';

/**
 * Open Cells: fallback page.
 *
 * The route `/not-found` is declared with `notFound: true` in `src/router/routes.ts`, so the Cells
 * router mounts this page for any URL it cannot match - including a `navigate('not-found')` done by
 * a page when the params are invalid.
 *
 * It uses `PageController` (from `@open-cells/page-controller`), the smallest of the Cells page
 * mixins: it only adds `subscribe` / `navigate`, which is all this page needs to send the user back
 * to the home page through the router.
 */
// @ts-ignore
@customElement('not-found-page')
export class NotFoundPage extends PageTransitionsMixin(LitElement) {
  // Open Cells (page-controller): grants subscribe/navigate without the rest of the page mixins.
  pageController = new PageController(this);

  private _layout: PageLayout | null = null;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    // @ts-ignore
    return this;
  }

  firstUpdated(props: any) {
    super.firstUpdated?.(props);

    this._layout = this.querySelector('page-layout');
  }

  render() {
    return html`
      <page-layout>
        <div class="not-found">
          <md-icon filled>movie_filter</md-icon>
          <h2>No encontramos esa página</h2>
          <p>La dirección que buscas no corresponde a ninguna sección de Movie Cells.</p>

          <md-filled-button @click=${this._goHome}>Volver al inicio</md-filled-button>
        </div>
      </page-layout>
    `;
  }

  private _goHome() {
    // Open Cells (router): programmatic navigation, no full page reload.
    this.navigate('home');
  }

  onPageLeave() {
    this._layout?.resetScroll();
  }
}