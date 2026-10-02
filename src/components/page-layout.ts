import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ElementController } from '@open-cells/element-controller';
import { CHANNELS } from '../state/app-state.js';
import { styles } from './page-layout.css.js';

/**
 * Open Cells: shared layout Web Component slotted by every page.
 *
 * Every page renders its content as light DOM children of `<page-layout>`, which keeps the
 * component reusable and, at the same time, lets the global stylesheet (`src/css/main.css`) style
 * the page content. The scroller is published on the `scroll` channel (Open Cells pub/sub) so the
 * app shell can collapse its header without the layout knowing anything about the shell.
 */
// @ts-ignore
@customElement('page-layout')
export class PageLayout extends LitElement {
  // Open Cells (element-controller): grants publish/subscribe on this element.
  elementController = new ElementController(this);

  private _scroller: HTMLElement | undefined | null = null;

  private _onScroll = (event: Event) => {
    // Open Cells (channel): the shell listens to this channel and reacts to the scroll position.
    this.elementController.publish(CHANNELS.scroll, {
      scrollTop: (event.target as HTMLElement)?.scrollTop ?? 0,
    });
  };

  static styles = styles;

  firstUpdated(props: any) {
    super.firstUpdated(props);

    this._scroller = this.shadowRoot?.querySelector('.scroller');
    this._scroller?.addEventListener('scroll', this._onScroll);
  }

  disconnectedCallback() {
    // Same handler reference, so the listener is really removed (the demo created a new closure
    // here and the listener leaked).
    this._scroller?.removeEventListener('scroll', this._onScroll);
    this.elementController.unsubscribe(CHANNELS.scroll);
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="scroller">
        <div class="content">
          <div class="region">
            <div class="zone"><slot></slot></div>
          </div>
        </div>

        <div class="footer">
          <div class="region">
            <div class="zone">${this._footerTpl}</div>
          </div>
        </div>
      </div>
    `;
  }

  get _footerTpl() {
    return html`
      <div class="footer-content">
        <p>
          Datos de
          <a href="https://www.tvmaze.com/api" target="_blank" rel="noreferrer">TVMaze</a>
        </p>
        <p>Hecho con <a href="https://www.opencells.dev">Open Cells</a></p>
      </div>
    `;
  }

  /**
   * Public API of the component: pages call it from `onPageLeave` (Open Cells page lifecycle hook
   * provided by `@open-cells/page-mixin`) so a new page always starts at the top.
   */
  resetScroll() {
    this._scroller?.scrollTo(0, 0);
  }
}
